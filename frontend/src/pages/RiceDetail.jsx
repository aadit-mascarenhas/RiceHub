import { useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import Layout from '../components/Layout'
import MetaChip from '../components/MetaChip'
import CommentsPanel from '../components/CommentsPanel'
import useFetch from '../hooks/useFetch'
import useSavedRices from '../hooks/useSavedRices'
import useAuth from '../hooks/useAuth'
import { fetchRiceById, toggleLike } from '../data/mockApi'
import { formatCount } from '../utils/format'

export default function RiceDetail() {
  const { id } = useParams()
  const { isSaved, toggleSave } = useSavedRices()
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  // Like state keyed by rice id so navigating between rices never shows a
  // stale override (derived, no effect needed).
  const [likeOverride, setLikeOverride] = useState(null)
  const [likeError, setLikeError] = useState(null)

  // Memoized: an inline fetcher would change identity every render and
  // retrigger useFetch's effect in an infinite refetch loop.
  const loadRice = useCallback(() => fetchRiceById(id), [id])
  const { data: rice, loading, error } = useFetch(loadRice)

  const handleLike = async () => {
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(`/rice/${id}`)}`)
      return
    }
    try {
      const updated = await toggleLike(id, token)
      setLikeOverride({ id, likes: updated.likes || [] })
      setLikeError(null)
    } catch (err) {
      setLikeError(err.message || 'LIKE_FAILED')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-page px-4 py-12 lg:px-12">
          <div className="animate-pulse space-y-8">
            <div className="h-16 w-3/4 bg-surface-container" />
            <div className="aspect-video bg-surface-container" />
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !rice) {
    return (
      <Layout>
        <div className="mx-auto max-w-page px-4 py-12 lg:px-12">
          <p className="border-2 border-error bg-surface-container p-6 font-mono text-sm text-error">
            &gt; ERR: {error || 'RICE_NOT_FOUND'}
          </p>
        </div>
      </Layout>
    )
  }

  const saved = isSaved(rice._id)
  const images = rice.images || []
  const likes = likeOverride && likeOverride.id === id ? likeOverride.likes : rice.likes || []
  const liked = Boolean(user && likes.includes(user.handle))

  return (
    <Layout>
      <div className="mx-auto max-w-page px-4 py-12 lg:px-12">
        <div className="flex flex-col gap-12">
          {/* Header */}
          <header className="flex flex-col gap-6 border-b-2 border-outline-variant pb-8 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-on-surface lg:text-5xl">
                {rice.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  to="#"
                  className="group flex items-center gap-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center border-2 border-primary bg-surface-bright shadow-hard-sm group-hover:border-terminal-green group-hover:shadow-hard-green-sm">
                    <span className="font-mono text-on-surface">
                      {rice.author?.slice(1, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-on-surface group-hover:text-terminal-green transition-colors uppercase">
                      {rice.author}
                    </span>
                  </div>
                </Link>
                <span className="hidden h-2 w-2 rounded-full bg-outline-variant md:block" />
                <div className="flex items-center gap-4 font-mono text-xs uppercase text-on-surface-variant">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">visibility</span>
                    {formatCount(rice.views)} Views
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">favorite</span>
                    {formatCount(likes.length)} Likes
                  </span>
                </div>
                {likeError && (
                  <span className="font-mono text-xs text-error">&gt; ERR: {likeError}</span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex shrink-0 flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleLike}
                className={`flex h-12 items-center gap-2 border-2 px-4 font-mono text-xs uppercase transition-all shadow-hard-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                  liked
                    ? 'border-error bg-surface-container text-error'
                    : 'border-primary bg-surface-container text-on-surface hover:border-error hover:text-error'
                }`}
                title={token ? (liked ? 'Unlike' : 'Like') : 'Log in to like'}
              >
                <span
                  className="material-symbols-outlined"
                  style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
                {formatCount(likes.length)}
              </button>
              <button
                type="button"
                onClick={() => toggleSave(rice._id)}
                className={`flex h-12 w-12 items-center justify-center border-2 transition-all shadow-hard-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                  saved
                    ? 'border-terminal-green bg-surface-container text-terminal-green'
                    : 'border-primary bg-surface-container text-on-surface hover:border-terminal-green hover:text-terminal-green'
                }`}
                title={saved ? 'Remove from saved' : 'Save rice'}
              >
                <span
                  className="material-symbols-outlined"
                  style={saved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  bookmark
                </span>
              </button>
              <a
                href={rice.dotfilesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 items-center gap-3 bg-primary px-6 font-mono text-xs uppercase text-on-primary border-2 border-on-primary transition-all shadow-hard-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                <span className="material-symbols-outlined">terminal</span>
                Open Dotfiles
              </a>
            </div>
          </header>

          {/* Main Content Split */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Gallery & Description */}
            <div className="flex flex-col gap-12 lg:col-span-8">
              {/* Gallery Section */}
              <section className="flex flex-col gap-4">
                {/* Main Image */}
                <div className="group relative w-full overflow-hidden border-2 border-primary bg-surface-container shadow-hard-sm">
                  <div className="aspect-video">
                    <img
                      src={images[activeImageIndex]}
                      alt={rice.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                        className="pointer-events-auto absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border-2 border-primary bg-surface/80 text-primary opacity-0 backdrop-blur-sm transition-all hover:border-terminal-green hover:text-terminal-green group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined">arrow_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                        className="pointer-events-auto absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center border-2 border-primary bg-surface/80 text-primary opacity-0 backdrop-blur-sm transition-all hover:border-terminal-green hover:text-terminal-green group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined">arrow_right</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`aspect-video overflow-hidden border-2 transition-all ${
                          index === activeImageIndex
                            ? 'border-terminal-green shadow-hard-green-sm opacity-100'
                            : 'border-primary opacity-60 hover:opacity-100 hover:border-terminal-green grayscale hover:grayscale-0'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${rice.title} thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Description */}
              <section className="relative border-2 border-primary bg-surface-container p-8 shadow-hard-sm">
                <div className="absolute left-0 top-0 h-2 w-full bg-terminal-green" />
                <h2 className="mb-4 border-b-2 border-outline-variant pb-2 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                  ReadMe.md
                </h2>
                <p className="text-on-surface leading-relaxed">{rice.description}</p>
                {rice.dotfilesUrl && (
                  <div className="mt-6 border-l-2 border-terminal-green bg-surface-container-low pl-4">
                    <pre className="overflow-x-auto font-mono text-sm text-secondary">
                      <code>{`git clone ${rice.dotfilesUrl} ~/.dotfiles\ncd ~/.dotfiles\n./install.sh`}</code>
                    </pre>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Meta & Comments */}
            <div className="flex flex-col gap-8 lg:col-span-4">
              {/* System Specs */}
              <section className="border-2 border-primary bg-surface-container p-6 shadow-hard-sm">
                <h3 className="mb-4 border-b-2 border-outline-variant pb-2 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                  System Specs
                </h3>
                <div className="flex flex-col gap-3">
                  <SpecRow label="OS" value={rice.distro} />
                  <SpecRow label="WM" value={rice.wm} />
                  {rice.terminal && <SpecRow label="Terminal" value={rice.terminal} />}
                  {rice.bar && <SpecRow label="Bar" value={rice.bar} />}
                  {rice.launcher && <SpecRow label="Launcher" value={rice.launcher} />}
                  {rice.colorScheme && <SpecRow label="Theme" value={rice.colorScheme} />}
                </div>
              </section>

              {/* Tags */}
              {rice.tags?.length > 0 && (
                <section className="border-2 border-primary bg-surface-container p-6 shadow-hard-sm">
                  <h3 className="mb-4 border-b-2 border-outline-variant pb-2 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {rice.tags.map((tag) => (
                      <MetaChip key={tag} text={tag} />
                    ))}
                  </div>
                </section>
              )}

              {/* Comments (live, Exp 8) */}
              <CommentsPanel riceId={id} key={id} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function SpecRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/50 py-2 last:border-b-0">
      <span className="font-mono text-xs uppercase text-on-surface-variant">{label}</span>
      <span className="border border-outline bg-surface-container px-2 py-1 font-mono text-xs text-on-surface">
        [ {value?.toUpperCase()} ]
      </span>
    </div>
  )
}
