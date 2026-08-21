import MetaChip from './MetaChip'

export default function SavedRiceCard({ rice }) {
  return (
    <div className="group card-lift-white relative flex h-[420px] flex-col border-2 border-outline bg-surface-container">
      <button
        title="Remove from saved"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center border-2 border-outline bg-surface-container transition-colors hover:border-primary"
      >
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          bookmark
        </span>
      </button>

      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden border-b-2 border-outline">
        <img
          src={rice.image}
          alt={rice.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex gap-2">
          {rice.tags.map((tag) => (
            <MetaChip key={tag} text={tag} />
          ))}
        </div>
        <h3 className="mb-2 truncate font-display text-lg font-semibold text-on-surface">
          {rice.title}
        </h3>
        <p className="mb-4 flex-1 line-clamp-2 text-sm text-on-surface-variant">
          {rice.description}
        </p>
        <div className="mt-auto flex items-center gap-3 border-t border-outline-variant pt-4">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline bg-surface-container">
            {rice.avatar ? (
              <img
                src={rice.avatar}
                alt={rice.author}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-mono text-xs text-on-surface-variant">
                {rice.author.slice(1, 2).toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-mono text-sm text-on-surface-variant">
            {rice.author}
          </span>
        </div>
      </div>
    </div>
  )
}