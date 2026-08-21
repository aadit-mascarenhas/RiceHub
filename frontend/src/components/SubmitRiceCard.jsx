export default function SubmitRiceCard() {
  return (
    <a
      href="/dashboard?new=1"
      className="group card-lift-green flex h-[420px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-outline-variant bg-surface-container"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-outline-variant transition-colors group-hover:border-terminal-green">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant transition-colors group-hover:text-terminal-green">
          add
        </span>
      </div>
      <span className="font-display text-lg text-on-surface-variant transition-colors group-hover:text-terminal-green">
        SUBMIT NEW RICE
      </span>
    </a>
  )
}