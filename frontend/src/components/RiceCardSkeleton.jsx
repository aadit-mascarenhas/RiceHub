export default function RiceCardSkeleton() {
  return (
    <article className="flex flex-col border-2 border-outline-variant bg-surface-container">
      <div className="flex aspect-video w-full items-center justify-center border-b-2 border-outline-variant">
        <span className="font-mono text-sm text-outline-variant">LOADING_PREVIEW...</span>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="h-5 w-2/3 animate-pulse bg-surface-container-high" />
        <div className="h-4 w-1/3 animate-pulse bg-surface-container-high" />
        <div className="h-4 w-1/4 animate-pulse bg-surface-container-high" />
      </div>
    </article>
  )
}