export default function MetaChip({ text }) {
  return (
    <span className="border border-outline px-2 py-1 font-mono text-[10px] uppercase text-on-surface-variant">
      {`[ ${text} ]`}
    </span>
  )
}