import { Link } from 'react-router'
import MetaChip from './MetaChip'
import { formatCount } from '../utils/format'
import useSavedRices from '../hooks/useSavedRices'

export default function RiceCard({ rice }) {
  const { isSaved, toggleSave } = useSavedRices()
  const saved = isSaved(rice._id)

  return (
    <article className="group flex flex-col border-2 border-on-surface bg-surface-container shadow-hard transition-transform hover:-translate-y-1 hover:shadow-hard-green">
      {/* Image */}
      <Link to={`/rice/${rice._id}`} className="relative aspect-video w-full overflow-hidden border-b-2 border-on-surface">
        <img
          src={rice.images?.[0]}
          alt={rice.title}
          className="h-full w-full object-cover grayscale-[20%] transition-all duration-500 group-hover:grayscale-0"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <Link to={`/rice/${rice._id}`} className="truncate font-mono text-lg font-semibold uppercase text-on-surface hover:text-terminal-green transition-colors">
            {rice.title}
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-1 text-on-surface-variant hover:text-terminal-green">
              <span className="material-symbols-outlined text-lg">favorite</span>
              <span className="font-mono text-xs">{formatCount(rice.likes?.length || 0)}</span>
            </div>
            <button
              type="button"
              onClick={() => toggleSave(rice._id)}
              title={saved ? 'Remove from saved' : 'Save rice'}
              aria-pressed={saved}
              className={`flex h-8 w-8 items-center justify-center border-2 transition-colors ${
                saved
                  ? 'border-terminal-green text-terminal-green'
                  : 'border-outline text-on-surface-variant hover:border-terminal-green hover:text-terminal-green'
              }`}
            >
              <span
                className="material-symbols-outlined text-base"
                style={
                  saved ? { fontVariationSettings: "'FILL' 1" } : undefined
                }
              >
                bookmark
              </span>
            </button>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {rice.tags.map((tag) => (
            <MetaChip key={tag} text={tag} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3 border-t-2 border-outline-variant pt-4">
          <div className="flex h-8 w-8 items-center justify-center border-2 border-on-surface bg-surface-bright">
            <span className="font-mono text-on-surface">
              {rice.author?.slice(1, 2).toUpperCase()}
            </span>
          </div>
          <span className="font-mono text-xs uppercase text-on-surface">
            {rice.author}
          </span>
        </div>
      </div>
    </article>
  )
}
