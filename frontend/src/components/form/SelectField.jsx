export default function SelectField({ hasError, children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full cursor-pointer appearance-none border-2 bg-surface p-4 font-mono text-sm text-on-surface transition-all focus:border-terminal-green focus:shadow-hard-green-sm focus:outline-none ${
          hasError ? 'border-error' : 'border-outline'
        }`}
      >
        {children}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
        arrow_drop_down
      </span>
    </div>
  )
}