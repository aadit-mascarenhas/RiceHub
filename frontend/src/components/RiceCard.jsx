import MetaChip from './MetaChip'
import { formatCount } from '../utils/format'

export default function RiceCard({ rice }) {
  return (
    <article className="group flex flex-col border-2 border-on-surface bg-surface-container shadow-hard transition-transform hover:-translate-y-1 hover:shadow-hard-green">
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden border-b-2 border-on-surface">
        <img
          src={rice.image}
          alt={rice.title}
          className="h-full w-full object-cover grayscale-[20%] transition-all duration-500 group-hover:grayscale-0"
        />
        <span className="absolute right-0 top-0 flex items-center gap-2 border-b-2 border-l-2 border-on-surface bg-background px-3 py-1">
          <span className="material-symbols-outlined text-sm font-normal text-terminal-green">
            terminal
          </span>
          <span className="font-mono text-xs text-on-surface">
            {rice.protocol}
          </span>
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="truncate font-mono text-lg font-semibold uppercase text-on-surface">
            {rice.title}
          </h2>
          <div className="flex shrink-0 items-center gap-1 text-on-surface-variant hover:text-terminal-green">
            <span className="material-symbols-outlined text-lg">favorite</span>
            <span className="font-mono text-xs">{formatCount(rice.likes)}</span>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {rice.tags.map((tag) => (
            <MetaChip key={tag} text={tag} />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3 border-t-2 border-outline-variant pt-4">
          {rice.avatar ? (
            <img
              src={rice.avatar}
              alt={rice.author}
              className="h-8 w-8 border-2 border-on-surface object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center border-2 border-on-surface bg-surface-bright">
              <span className="font-mono text-on-surface">
                {rice.author.slice(1, 2).toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-mono text-xs uppercase text-on-surface">
            {rice.author}
          </span>
        </div>
      </div>
    </article>
  )
}