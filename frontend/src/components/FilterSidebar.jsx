import FilterCheckbox from './FilterCheckbox'
import { FILTER_GROUPS } from '../data/filterOptions'

export default function FilterSidebar({ selectedFilters, onToggle, onClear }) {
  return (
    <aside className="z-10 flex h-fit flex-col gap-8 border-b-2 border-outline-variant bg-background pb-4 lg:sticky lg:top-[100px] lg:w-72 lg:shrink-0 lg:border-b-0 lg:bg-transparent lg:pb-0">
      {FILTER_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-3">
          <h3 className="mb-2 border-b-2 border-outline-variant pb-1 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
            {group.title}
          </h3>
          {group.options.map((option) => (
            <FilterCheckbox
              key={option.value}
              label={option.label}
              count={option.count}
              checked={selectedFilters[group.field].includes(option.value)}
              onChange={() => onToggle(group.field, option.value)}
            />
          ))}
        </div>
      ))}
      <button
        onClick={onClear}
        className="mt-4 w-full border-2 border-outline bg-surface-container py-3 font-mono text-xs uppercase tracking-widest text-on-surface transition-colors hover:border-terminal-green"
      >
        Clear Filters
      </button>
    </aside>
  )
}