import { useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';

// One PDF at a time: the grid is the working surface, and a second document
// would need either tabs or a visible file boundary in it. Everything dropped
// is handed to the caller, which decides what to refuse and why, so the reasons
// stay in one place.
export function Dropzone({
  onFile,
  compact = false,
}: {
  onFile: (file: File) => void;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const handle = (list: FileList | null) => {
    const file = list?.[0];
    if (file) {
      onFile(file);
    }
  };

  return (
    <div
      className={`ppo-dropzone${isOver ? ' ppo-over' : ''}${compact ? ' ppo-compact' : ''}`}
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
      <span className="ppo-dropzone-label">
        {compact ? t.pdfPageOrganizer.replaceFile : t.pdfPageOrganizer.dropzone}
      </span>
      {!compact && (
        <span className="ppo-dropzone-hint">
          {t.pdfPageOrganizer.dropzoneHint}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
