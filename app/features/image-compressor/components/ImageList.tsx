import { useLocale } from '~/i18n/locale';
import { compareSize, formatBytes, formatPercent } from '../lib/format';
import { matchesFilter } from '../lib/navigation';
import type { ImageItem, ListFilter } from '../lib/types';

const FILTERS: ListFilter[] = [
  'all',
  'not-downloaded',
  'customized',
  'downloaded',
  'error',
];

function StateBadge({ item }: { item: ImageItem }) {
  const { t } = useLocale();
  // Symbol plus word: never colour alone.
  if (item.processingState === 'error') {
    return (
      <span className="ic-badge ic-badge-error">
        × {t.imageCompressor.stateError}
      </span>
    );
  }
  if (item.downloaded) {
    return (
      <span className="ic-badge ic-badge-done">
        ✓ {t.imageCompressor.stateDownloaded}
      </span>
    );
  }
  if (item.processingState !== 'ready') {
    return (
      <span className="ic-badge">… {t.imageCompressor.stateProcessing}</span>
    );
  }
  if (item.settingsOverride !== null) {
    return (
      <span className="ic-badge ic-badge-custom">
        ● {t.imageCompressor.stateCustomized}
      </span>
    );
  }
  return null;
}

export function ImageList({
  items,
  currentIndex,
  filter,
  onSelect,
  onRemove,
  onFilterChange,
}: {
  items: ImageItem[];
  currentIndex: number;
  filter: ListFilter;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onFilterChange: (filter: ListFilter) => void;
}) {
  const { t } = useLocale();
  const visible = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => matchesFilter(item, filter));

  return (
    <section className="ic-list" aria-labelledby="ic-list-heading">
      <h2 id="ic-list-heading">
        {t.imageCompressor.listHeading(items.length)}
      </h2>

      <div
        className="ic-filters"
        role="group"
        aria-label={t.imageCompressor.filterLabel}
      >
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            className={`ic-filter${filter === name ? ' ic-filter-on' : ''}`}
            aria-pressed={filter === name}
            onClick={() => onFilterChange(name)}
          >
            {t.imageCompressor.filters[name]}
          </button>
        ))}
      </div>

      <ul className="ic-thumbs">
        {visible.map(({ item, index }) => {
          const size = item.outputBlob
            ? compareSize(item.sourceFile.size, item.outputBlob.size)
            : null;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`ic-thumb${index === currentIndex ? ' ic-thumb-on' : ''}`}
                aria-current={index === currentIndex ? 'true' : undefined}
                onClick={() => onSelect(index)}
              >
                <img src={item.sourceUrl} alt="" width={56} height={56} />
                <span className="ic-thumb-body">
                  <span className="ic-thumb-name" title={item.sourceFile.name}>
                    {item.sourceFile.name}
                  </span>
                  <span className="ic-thumb-size">
                    {formatBytes(item.sourceFile.size)}
                    {size && (
                      <>
                        {' → '}
                        {formatBytes(size.after)}{' '}
                        <span className={size.grew ? 'ic-grew' : 'ic-saved'}>
                          {size.grew ? '+' : '−'}
                          {formatPercent(size.percent)}
                        </span>
                      </>
                    )}
                  </span>
                  <StateBadge item={item} />
                </span>
              </button>
              <button
                type="button"
                className="ic-thumb-remove"
                onClick={() => onRemove(item.id)}
                aria-label={t.imageCompressor.removeOne(item.sourceFile.name)}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="ic-hint">{t.imageCompressor.emptyFilter}</p>
      )}
    </section>
  );
}
