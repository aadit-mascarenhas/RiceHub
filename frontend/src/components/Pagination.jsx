export default function Pagination() {
  return (
    <div className="mt-16 flex items-center justify-center gap-2">
      <button className="flex h-10 w-10 items-center justify-center border-2 border-outline-variant text-on-surface-variant transition-colors hover:border-terminal-green hover:text-terminal-green">
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      {['1', '2', '3', '...', '42'].map((page, index) =>
        page === '...' ? (
          <span key={index} className="mx-2 font-mono text-on-surface-variant">
            ...
          </span>
        ) : (
          <button
            key={index}
            className={`flex h-10 w-10 items-center justify-center border-2 font-mono transition-colors ${
              page === '1'
                ? 'border-on-surface bg-on-surface font-bold text-background'
                : 'border-outline-variant text-on-surface hover:border-on-surface'
            }`}
          >
            {page}
          </button>
        )
      )}
      <button className="flex h-10 w-10 items-center justify-center border-2 border-outline-variant text-on-surface-variant transition-colors hover:border-terminal-green hover:text-terminal-green">
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  )
}