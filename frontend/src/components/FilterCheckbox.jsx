export default function FilterCheckbox({ label, count, checked, onChange }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <div
        className={`relative h-4 w-4 border-2 bg-surface-container transition-colors ${
          checked
            ? 'border-terminal-green'
            : 'border-outline group-hover:border-terminal-green'
        }`}
      >
        {checked && <div className="absolute inset-0 bg-terminal-green" />}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`font-mono text-sm transition-colors ${
          checked ? 'text-terminal-green' : 'text-on-surface group-hover:text-terminal-green'
        }`}
      >
        {label}
      </span>
      {count !== undefined && (
        <span className="ml-auto font-mono text-xs text-on-surface-variant">{count}</span>
      )}
    </label>
  )
}