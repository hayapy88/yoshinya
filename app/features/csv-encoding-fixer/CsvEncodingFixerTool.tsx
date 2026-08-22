import { useEffect, useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';
import { track } from '~/lib/analytics';
import { ToolIntro } from '~/components/tool/ToolIntro';
import { ToolGuide } from '~/components/tool/ToolGuide';
import { analyze, excelRisk, toUtf8WithBom } from './lib/encoding';
import {
  classify,
  fixedFileName,
  type CsvItem,
  type RejectedFile,
} from './lib/files';
import './csv-encoding-fixer.css';

const TOOL = 'csv-encoding-fixer' as const;

function save(bytes: Uint8Array, name: string) {
  // text/csv rather than the original type: some systems export CSV as
  // application/octet-stream, which makes browsers treat the download as an
  // unknown binary.
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], { type: 'text/csv' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Dropzone({
  onFiles,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const handle = (list: FileList | null) => {
    if (list && list.length > 0) {
      onFiles(Array.from(list));
    }
  };

  return (
    <div
      className={`cef-dropzone${isOver ? ' cef-over' : ''}${compact ? ' cef-compact' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        handle(e.dataTransfer.files);
      }}
    >
      <span className="cef-dropzone-label">
        {compact ? t.csvEncodingFixer.addMore : t.csvEncodingFixer.dropzone}
      </span>
      {!compact && (
        <span className="cef-dropzone-hint">
          {t.csvEncodingFixer.supportedFormats}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        // Deliberately wide: a CSV routinely arrives as text/plain or with no
        // type at all, and a filter that hides the user's own file is worse
        // than one that lets an odd file through to a clear message.
        accept=".csv,.tsv,.txt,text/csv,text/plain"
        multiple
        hidden
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function CsvEncodingFixerTool() {
  const { t } = useLocale();
  const [items, setItems] = useState<CsvItem[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);

  useEffect(() => {
    track('tool_opened', { tool: TOOL });
  }, []);

  const addFiles = async (files: File[]) => {
    const { accepted, rejected: refused } = classify(files, items.length, () =>
      crypto.randomUUID(),
    );
    if (refused.length > 0) {
      setRejected((current) => [...current, ...refused]);
    }
    const loaded = await Promise.all(
      accepted.map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        return {
          id: crypto.randomUUID(),
          file,
          bytes,
          diagnosis: analyze(bytes),
          risk: excelRisk(bytes),
        };
      }),
    );
    if (loaded.length > 0) {
      setItems((current) => [...current, ...loaded]);
      track('files_added', { tool: TOOL, file_count: loaded.length });
    }
  };

  const downloadOne = (item: CsvItem) => {
    save(toUtf8WithBom(item.bytes), fixedFileName(item.file.name));
    track('download_completed', { tool: TOOL, file_count: 1 });
  };

  return (
    <main className="cef-page">
      <ToolIntro
        heading={t.csvEncodingFixerPage.heading}
        lead={t.csvEncodingFixerPage.lead}
        privacyNote={t.csvEncodingFixerPage.privacyNote}
      />

      <section className="cef-section">
        <h2>{t.csvEncodingFixer.addHeading}</h2>
        <Dropzone onFiles={(files) => void addFiles(files)} />
      </section>

      {rejected.length > 0 && (
        <section className="cef-rejected" role="alert">
          <h2>{t.csvEncodingFixer.rejectedHeading}</h2>
          <ul>
            {rejected.map((file) => (
              <li key={file.id}>
                <strong>{file.name}</strong>{' '}
                <span>{t.csvEncodingFixer.errors[file.errorCode]}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="cef-btn cef-btn-secondary"
            onClick={() => setRejected([])}
          >
            {t.csvEncodingFixer.dismiss}
          </button>
        </section>
      )}

      {items.length > 0 && (
        <section className="cef-section">
          <div className="cef-section-head">
            <h2>{t.csvEncodingFixer.filesHeading(items.length)}</h2>
            <div className="cef-head-actions">
              <button
                type="button"
                className="cef-btn cef-btn-secondary"
                onClick={() => setItems([])}
              >
                {t.csvEncodingFixer.removeAll}
              </button>
            </div>
          </div>

          <ul className="cef-list">
            {items.map((item) => {
              const { diagnosis } = item;
              // Three states, and each one is told to the user rather than
              // silently acted on: a file that needs nothing, a file whose
              // bytes are right but unlabelled, and a file that needs
              // converting. Knowing which is what stops it happening again.
              const verdict = diagnosis.hasBom
                ? t.csvEncodingFixer.verdictAlreadyFine
                : diagnosis.bomOnly
                  ? t.csvEncodingFixer.verdictBomOnly
                  : t.csvEncodingFixer.verdictConvert(
                      t.csvEncodingFixer.encodings[diagnosis.encoding],
                    );
              return (
                <li key={item.id} className="cef-item">
                  <div className="cef-item-head">
                    <strong className="cef-name">{item.file.name}</strong>
                    <span
                      className={`cef-badge${diagnosis.bomOnly ? ' cef-badge-bom' : ''}`}
                    >
                      {t.csvEncodingFixer.encodings[diagnosis.encoding]}
                      {diagnosis.hasBom ? ' + BOM' : ''}
                    </span>
                    <button
                      type="button"
                      className="cef-linkbtn"
                      onClick={() =>
                        setItems((current) =>
                          current.filter((i) => i.id !== item.id),
                        )
                      }
                    >
                      {t.csvEncodingFixer.removeOne}
                    </button>
                  </div>

                  <p className="cef-verdict">{verdict}</p>

                  {diagnosis.damaged && (
                    <p className="cef-warn">
                      {t.csvEncodingFixer.damagedWarning}
                    </p>
                  )}

                  {/* Said even though the fix itself succeeded. Handing back a
                      correctly encoded file that Excel still cannot open, with
                      no explanation, is how a working tool looks broken. */}
                  {item.risk.heavy && (
                    <p className="cef-warn">
                      {t.csvEncodingFixer.excelHeavyWarning(
                        (item.risk.sizeBytes / 1024 / 1024).toFixed(1),
                      )}
                    </p>
                  )}

                  <details className="cef-preview">
                    <summary>{t.csvEncodingFixer.previewHeading}</summary>
                    <pre>{diagnosis.preview}</pre>
                  </details>

                  <button
                    type="button"
                    className="cef-btn cef-btn-primary"
                    onClick={() => downloadOne(item)}
                  >
                    {t.csvEncodingFixer.download}
                  </button>
                </li>
              );
            })}
          </ul>

          <Dropzone onFiles={(files) => void addFiles(files)} compact />
        </section>
      )}

      <ToolGuide guide={t.csvEncodingFixerGuide} current={TOOL} />
    </main>
  );
}

export default CsvEncodingFixerTool;
