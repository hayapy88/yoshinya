import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatAlphaIndex, formatNumericIndex } from '../lib/rename'
import { validateTextValue } from '../lib/validate'
import type {
  DateFormat,
  IndexStyle,
  RenameToken,
  TimeFormat,
} from '../lib/types'

type Props = {
  tokens: RenameToken[]
  onChange: (tokens: RenameToken[]) => void
}

type TokenKind = RenameToken['kind']

const PALETTE: { kind: TokenKind; label: string }[] = [
  { kind: 'text', label: '任意文字列' },
  { kind: 'separator', label: '区切り文字' },
  { kind: 'date', label: '日付' },
  { kind: 'time', label: '時間' },
  { kind: 'index', label: 'index' },
]

const DATE_FORMATS: DateFormat[] = ['yyyy-mm-dd', 'yyyy-m-d', 'm-d', 'd-m-yyyy']
const TIME_FORMATS: TimeFormat[] = ['hh-mm-ss', 'hh-mm']

const INDEX_STYLES: { value: string; label: string; style: IndexStyle }[] = [
  { value: 'num1', label: '数字1桁（1, 2, 3...）', style: { type: 'numeric', padding: 1 } },
  { value: 'num2', label: '数字2桁（01, 02...）', style: { type: 'numeric', padding: 2 } },
  { value: 'num3', label: '数字3桁（001, 002...）', style: { type: 'numeric', padding: 3 } },
  { value: 'alphaLower', label: 'アルファベット小文字（a, b, c...）', style: { type: 'alpha', letterCase: 'lower' } },
  { value: 'alphaUpper', label: 'アルファベット大文字（A, B, C...）', style: { type: 'alpha', letterCase: 'upper' } },
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function currentTime(): string {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function createToken(kind: TokenKind): RenameToken {
  const id = crypto.randomUUID()
  switch (kind) {
    case 'text':
      return { id, kind, value: '' }
    case 'separator':
      return { id, kind, char: '_' }
    case 'date':
      return { id, kind, format: 'yyyy-mm-dd', source: 'fixed', fixedDate: todayISO() }
    case 'time':
      return { id, kind, format: 'hh-mm', source: 'fixed', fixedTime: currentTime() }
    case 'index':
      return { id, kind, style: { type: 'numeric', padding: 2 }, start: 1 }
  }
}

function indexStyleValue(style: IndexStyle): string {
  if (style.type === 'numeric') {
    return `num${style.padding}`
  }
  return style.letterCase === 'lower' ? 'alphaLower' : 'alphaUpper'
}

function indexSample(style: IndexStyle): string {
  return style.type === 'numeric'
    ? formatNumericIndex(1, style.padding)
    : formatAlphaIndex(1, style.letterCase)
}

// Tokens of a kind are numbered by their order in the rule (任意文字列1, 任意文字列2, ...).
function kindNumbers(tokens: RenameToken[], kind: TokenKind): Map<string, number> {
  const numbers = new Map<string, number>()
  let n = 0
  for (const token of tokens) {
    if (token.kind === kind) {
      n += 1
      numbers.set(token.id, n)
    }
  }
  return numbers
}

function tokenChipLabel(token: RenameToken, textNumber?: number): string {
  switch (token.kind) {
    case 'text':
      return `任意文字列${textNumber ?? ''}`
    case 'separator':
      return token.char
    case 'date':
      return `日付(${token.format})`
    case 'time':
      return `時間(${token.format})`
    case 'index':
      return `index(${indexSample(token.style)})`
  }
}

export function RuleSection({ tokens, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )
  const numbers = kindNumbers(tokens, 'text')
  const separatorNumbers = kindNumbers(tokens, 'separator')

  const updateToken = (id: string, patch: Partial<RenameToken>) => {
    onChange(
      tokens.map((t) => (t.id === id ? ({ ...t, ...patch } as RenameToken) : t)),
    )
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return
    }
    const fromPalette = active.data.current?.from === 'palette'
    if (fromPalette) {
      const token = createToken(active.data.current?.kind as TokenKind)
      const overIndex = tokens.findIndex((t) => t.id === over.id)
      if (overIndex >= 0) {
        onChange([...tokens.slice(0, overIndex), token, ...tokens.slice(overIndex)])
      } else if (over.id === 'rule-area') {
        onChange([...tokens, token])
      }
      return
    }
    if (active.id === over.id) {
      return
    }
    const oldIndex = tokens.findIndex((t) => t.id === active.id)
    const newIndex = tokens.findIndex((t) => t.id === over.id)
    if (oldIndex >= 0 && newIndex >= 0) {
      onChange(arrayMove(tokens, oldIndex, newIndex))
    }
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <p className="hint">トークンを下の規則エリアにドラッグして、ファイル名の形を組み立てます</p>
        <div className="palette">
          {PALETTE.map(({ kind, label }) => (
            <PaletteToken key={kind} kind={kind} label={label} />
          ))}
        </div>

        <RuleArea
          tokens={tokens}
          numbers={numbers}
          onRemove={(id) => onChange(tokens.filter((t) => t.id !== id))}
        />
      </DndContext>

      <div className="token-settings">
        {tokens.map((token) => (
          <TokenSettings
            key={token.id}
            token={token}
            textNumber={numbers.get(token.id)}
            separatorNumber={separatorNumbers.get(token.id)}
            onUpdate={updateToken}
          />
        ))}
      </div>
    </div>
  )
}

function PaletteToken({ kind, label }: { kind: TokenKind; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `palette-${kind}`, data: { from: 'palette', kind } })

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`token-chip palette-chip${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
    >
      {label}
    </button>
  )
}

function RuleArea({
  tokens,
  numbers,
  onRemove,
}: {
  tokens: RenameToken[]
  numbers: Map<string, number>
  onRemove: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'rule-area' })

  return (
    <div
      ref={setNodeRef}
      className={`rule-area${isOver ? ' rule-area-over' : ''}`}
    >
      <SortableContext
        items={tokens.map((t) => t.id)}
        strategy={horizontalListSortingStrategy}
      >
        {tokens.length === 0 && (
          <span className="rule-placeholder">ここにトークンをドロップ</span>
        )}
        {tokens.map((token) => (
          <SortableRuleToken
            key={token.id}
            token={token}
            textNumber={numbers.get(token.id)}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>
      <span className="token-chip ext-chip">.拡張子</span>
    </div>
  )
}

function SortableRuleToken({
  token,
  textNumber,
  onRemove,
}: {
  token: RenameToken
  textNumber?: number
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: token.id, data: { from: 'rule' } })

  return (
    <span
      ref={setNodeRef}
      className={`token-chip rule-chip${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      {tokenChipLabel(token, textNumber)}
      <button
        type="button"
        className="remove-button"
        aria-label={`${tokenChipLabel(token, textNumber)} を削除`}
        onClick={() => onRemove(token.id)}
      >
        ✕
      </button>
    </span>
  )
}

function TokenSettings({
  token,
  textNumber,
  separatorNumber,
  onUpdate,
}: {
  token: RenameToken
  textNumber?: number
  separatorNumber?: number
  onUpdate: (id: string, patch: Partial<RenameToken>) => void
}) {
  switch (token.kind) {
    case 'separator':
      return (
        <div className="settings-panel">
          <label className="settings-label" htmlFor={`separator-${token.id}`}>
            区切り文字{separatorNumber}
          </label>
          <select
            id={`separator-${token.id}`}
            value={token.char}
            onChange={(e) => onUpdate(token.id, { char: e.target.value })}
          >
            <option value="_">_（アンダースコア）</option>
            <option value="-">-（ハイフン）</option>
            <option value=".">.（ドット）</option>
          </select>
        </div>
      )
    case 'text': {
      const error = validateTextValue(token.value)
      return (
        <div className="settings-panel">
          <label className="settings-label" htmlFor={`text-${token.id}`}>
            任意文字列{textNumber}
          </label>
          <input
            id={`text-${token.id}`}
            type="text"
            value={token.value}
            placeholder="例: 旅行"
            onChange={(e) => onUpdate(token.id, { value: e.target.value })}
          />
          {error && <p className="field-error">{error}</p>}
        </div>
      )
    }
    case 'date':
      return (
        <div className="settings-panel">
          <span className="settings-label">日付</span>
          <div className="settings-row">
            <label>
              フォーマット
              <select
                value={token.format}
                onChange={(e) =>
                  onUpdate(token.id, { format: e.target.value as DateFormat })
                }
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <div className="source-choice" role="radiogroup" aria-label="日付のソース">
              <label>
                <input
                  type="radio"
                  name={`date-source-${token.id}`}
                  checked={token.source === 'fixed'}
                  onChange={() =>
                    onUpdate(token.id, {
                      source: 'fixed',
                      fixedDate: token.fixedDate ?? todayISO(),
                    })
                  }
                />
                日付を指定
              </label>
              <label>
                <input
                  type="radio"
                  name={`date-source-${token.id}`}
                  checked={token.source === 'fileModified'}
                  onChange={() => onUpdate(token.id, { source: 'fileModified' })}
                />
                ファイルの更新日時を使う
              </label>
            </div>
            {token.source === 'fixed' && (
              <input
                type="date"
                aria-label="日付を選択"
                value={token.fixedDate ?? ''}
                onChange={(e) => onUpdate(token.id, { fixedDate: e.target.value })}
              />
            )}
          </div>
        </div>
      )
    case 'time':
      return (
        <div className="settings-panel">
          <span className="settings-label">時間</span>
          <div className="settings-row">
            <label>
              フォーマット
              <select
                value={token.format}
                onChange={(e) =>
                  onUpdate(token.id, { format: e.target.value as TimeFormat })
                }
              >
                {TIME_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <div className="source-choice" role="radiogroup" aria-label="時間のソース">
              <label>
                <input
                  type="radio"
                  name={`time-source-${token.id}`}
                  checked={token.source === 'fixed'}
                  onChange={() =>
                    onUpdate(token.id, {
                      source: 'fixed',
                      fixedTime: token.fixedTime ?? currentTime(),
                    })
                  }
                />
                時刻を指定
              </label>
              <label>
                <input
                  type="radio"
                  name={`time-source-${token.id}`}
                  checked={token.source === 'fileModified'}
                  onChange={() => onUpdate(token.id, { source: 'fileModified' })}
                />
                ファイルの更新日時を使う
              </label>
            </div>
            {token.source === 'fixed' && (
              <input
                type="time"
                aria-label="時刻を選択"
                step={token.format === 'hh-mm-ss' ? 1 : undefined}
                value={token.fixedTime ?? ''}
                onChange={(e) => onUpdate(token.id, { fixedTime: e.target.value })}
              />
            )}
          </div>
        </div>
      )
    case 'index':
      return (
        <div className="settings-panel">
          <label className="settings-label" htmlFor={`index-${token.id}`}>
            index
          </label>
          <select
            id={`index-${token.id}`}
            value={indexStyleValue(token.style)}
            onChange={(e) => {
              const chosen = INDEX_STYLES.find((s) => s.value === e.target.value)
              if (chosen) {
                onUpdate(token.id, { style: chosen.style })
              }
            }}
          >
            {INDEX_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )
  }
}
