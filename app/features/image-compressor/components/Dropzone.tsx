import { useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';

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
    if (list && list.length > 0) {
      onFiles(Array.from(list));
    }
  };

  return (
    <div
      className={`ic-dropzone${isOver ? ' ic-over' : ''}${compact ? ' ic-compact' : ''}`}
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
      <span className="ic-dropzone-label">
        {compact ? t.imageCompressor.addMore : t.imageCompressor.dropzone}
      </span>
      {!compact && (
        <span className="ic-dropzone-hint">
          {t.imageCompressor.supportedFormats}
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
