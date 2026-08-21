export default function Footer() {
  return (
    <footer className="mt-12 w-full border-t-2 border-outline-variant bg-surface-container-low py-12">
      <div className="mx-auto flex max-w-page flex-col items-center justify-between gap-8 px-4 md:flex-row lg:px-12">
        <div className="flex flex-col gap-2">
          <span className="font-display text-lg font-bold tracking-tight">
            RICE HUB
          </span>
          <p className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">
            Premium Linux Customization Repository
          </p>
        </div>
        <div className="px-4 py-2 border-2 border-terminal-green flex items-center gap-3">
          <span className="material-symbols-outlined text-terminal-green">
            bolt
          </span>
          <span className="font-mono text-sm text-terminal-green">
            POWERED_BY_LINUX
          </span>
        </div>
      </div>
    </footer>
  )
}