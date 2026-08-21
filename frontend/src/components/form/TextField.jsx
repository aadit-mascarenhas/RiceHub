export default function TextField({ hasError, prefix, ...props }) {
  const inputClasses = [
    'w-full border-2 font-mono text-sm text-on-surface outline-none transition-all',
    'placeholder:text-surface-bright focus:border-terminal-green focus:shadow-hard-green-sm',
    prefix ? 'bg-black py-3 pl-8 pr-4' : 'bg-surface p-4',
    hasError ? 'border-error' : prefix ? 'border-primary' : 'border-outline',
  ].join(' ')

  if (!prefix) return <input {...props} className={inputClasses} />

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none font-mono text-sm text-primary transition-colors group-focus-within:text-terminal-green">
        &gt;
      </span>
      <input {...props} className={inputClasses} />
    </div>
  )
}