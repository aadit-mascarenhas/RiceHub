import MetaChip from './MetaChip'
import { formatCount } from '../utils/format'

export default function DashboardCard({ rice }) {
  const approved = rice.status === 'APPROVED'

  return (
    <div className="group card-lift-green relative flex h-[420px] flex-col border-2 border-outline bg-surface-container">
      {/* Status + actions */}
      <div className="absolute top-4 left-4 z-10 border border-terminal-green bg-surface-container px-3 py-1">
        <span className="font-mono text-xs uppercase text-terminal-green">
          {rice.status}
        </span>
      </div>
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <button
          title="Edit"
          className="flex h-8 w-8 items-center justify-center border border-outline bg-surface-container transition-colors hover:bg-primary hover:text-on-primary"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
        <button
          title="Delete"
          className="flex h-8 w-8 items-center justify-center border border-outline bg-surface-container transition-colors hover:bg-error hover:text-on-error"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>

      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden border-b-2 border-outline">
        <img
          src={rice.image}
          alt={rice.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-surface/50 transition-colors duration-300 group-hover:bg-transparent" />
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
        <div
          className={`mt-auto flex items-center justify-between border-t border-outline-variant pt-4 ${
            approved ? '' : 'opacity-50'
          }`}
        >
          <span className="flex items-center gap-1 font-mono text-sm text-on-surface">
            <span className="material-symbols-outlined text-sm">visibility</span>
            {formatCount(rice.views)}
          </span>
          <span className="flex items-center gap-1 font-mono text-sm text-on-surface">
            <span className="material-symbols-outlined text-sm">favorite</span>
            {formatCount(rice.likes)}
          </span>
        </div>
      </div>
    </div>
  )
}