import { useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';

// Accepts PDFs only. Everything dropped is handed to the caller, which decides
// what to refuse and why, so the reasons stay in one place.
export function Dropzone({
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
    if (!list || list.length === 0) {
      return;
    }
    onFiles(Array.from(list));
  };

  return (
    <div
      className={`pte-dropzone${isOver ? ' pte-over' : ''}${compact ? ' pte-compact' : ''}`}
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
      <span className="pte-dropzone-label">
        {compact ? t.pdfTitleEditor.addMore : t.pdfTitleEditor.dropzone}
      </span>
      {!compact && (
        <span className="pte-dropzone-hint">
          {t.pdfTitleEditor.dropzoneHint}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
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
