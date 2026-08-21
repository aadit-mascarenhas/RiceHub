export default function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  className = 'space-y-2',
  labelClassName = 'block font-mono text-xs uppercase tracking-widest text-on-surface',
  children,
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="font-mono text-xs text-on-surface-variant">&gt; {hint}</p>
      )}
      {error && <p className="font-mono text-xs text-error">{error}</p>}
    </div>
  )
}