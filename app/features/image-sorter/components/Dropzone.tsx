import { useRef, useState } from 'react';
import { useLocale } from '~/i18n/locale';

// A dropzone that accepts image files only. Non-image files are reported back
// via onReject so the caller can show a clear reason.
export function Dropzone({
  onFiles,
}: {
  onFiles: (images: File[], rejectedCount: number) => void;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0) {
      return;
    }
    const all = Array.from(list);
    const images = all.filter((file) => file.type.startsWith('image/'));
    onFiles(images, all.length - images.length);
  };

  return (
    <div
      className={`is-dropzone${isOver ? ' is-over' : ''}`}
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
      {t.imageSorter.dropzone}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
