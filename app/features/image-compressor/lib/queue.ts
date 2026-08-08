import type { EncodeRequest, EncodeResponse } from './encode.worker'
import { LIMITS } from './types'

export type EncodeJob = Omit<EncodeRequest, 'jobId'> & {
  /** Identifies the image; a newer job for the same key cancels the older one. */
  key: string
  /** Higher runs first. The image on screen is worth more than the queue. */
  priority: number
}

export type EncodeResult = Exclude<EncodeResponse, { ok: false }>
export type EncodeFailure = Extract<EncodeResponse, { ok: false }>

type Pending = {
  jobId: string
  key: string
  priority: number
  request: EncodeRequest
  resolve: (response: EncodeResponse) => void
}

/**
 * Runs encode jobs through a small pool of workers.
 *
 * Two rules matter more than the pooling. First, the number in flight is
 * capped: handing a hundred full-size photos to the browser at once exhausts
 * memory long before it saves any time. Second, a job is keyed by image, and
 * queueing a new job for an image drops the older one — sliding a quality
 * slider produces a burst of requests and only the final value is worth
 * encoding, so results can never arrive out of order and overwrite a newer one.
 */
export class EncodeQueue {
  private readonly workers: Worker[] = []
  private readonly idle: Worker[] = []
  private readonly waiting: Pending[] = []
  private readonly running = new Map<Worker, Pending>()
  private readonly inflightByKey = new Map<string, string>()
  private counter = 0
  private disposed = false

  constructor(
    private readonly createWorker: () => Worker,
    private readonly size: number = LIMITS.concurrency,
  ) {}

  private ensureWorkers(): void {
    while (this.workers.length < this.size) {
      const worker = this.createWorker()
      worker.addEventListener('message', (event: MessageEvent<EncodeResponse>) =>
        this.handleMessage(worker, event.data),
      )
      this.workers.push(worker)
      this.idle.push(worker)
    }
  }

  private handleMessage(worker: Worker, response: EncodeResponse): void {
    const pending = this.running.get(worker)
    this.running.delete(worker)
    this.idle.push(worker)
    if (pending && pending.jobId === response.jobId) {
      if (this.inflightByKey.get(pending.key) === pending.jobId) {
        this.inflightByKey.delete(pending.key)
      }
      pending.resolve(response)
    }
    this.pump()
  }

  private pump(): void {
    if (this.disposed) {
      return
    }
    while (this.idle.length > 0 && this.waiting.length > 0) {
      // Highest priority first, oldest first within a priority.
      this.waiting.sort((a, b) => b.priority - a.priority)
      const pending = this.waiting.shift()!
      const worker = this.idle.shift()!
      this.running.set(worker, pending)
      worker.postMessage(pending.request)
    }
  }

  /**
   * Queues a job. Resolves with the response, or with a cancellation for a job
   * superseded by a newer one for the same image.
   */
  encode(job: EncodeJob): Promise<EncodeResponse | { cancelled: true }> {
    if (this.disposed) {
      return Promise.resolve({ cancelled: true })
    }
    this.ensureWorkers()
    this.cancelKey(job.key)

    this.counter += 1
    const jobId = `job-${this.counter}`
    this.inflightByKey.set(job.key, jobId)

    const { key, priority, ...rest } = job
    return new Promise((resolve) => {
      this.waiting.push({
        jobId,
        key,
        priority,
        request: { ...rest, jobId },
        resolve: resolve as (response: EncodeResponse) => void,
      })
      this.pump()
    })
  }

  /** Drops any queued job for an image. One already running is left to finish
   *  and its result discarded, because a worker cannot be interrupted. */
  private cancelKey(key: string): void {
    const index = this.waiting.findIndex((pending) => pending.key === key)
    if (index >= 0) {
      const [dropped] = this.waiting.splice(index, 1)
      dropped?.resolve({ cancelled: true } as never)
    }
    this.inflightByKey.delete(key)
  }

  dispose(): void {
    this.disposed = true
    for (const pending of this.waiting) {
      pending.resolve({ cancelled: true } as never)
    }
    this.waiting.length = 0
    for (const worker of this.workers) {
      worker.terminate()
    }
    this.workers.length = 0
    this.idle.length = 0
    this.running.clear()
    this.inflightByKey.clear()
  }
}

export function isCancelled(
  value: EncodeResponse | { cancelled: true },
): value is { cancelled: true } {
  return 'cancelled' in value
}
