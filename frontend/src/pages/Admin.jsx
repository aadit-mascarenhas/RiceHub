import { useState, useCallback } from 'react'
import Layout from '../components/Layout'
import ModerationCard from '../components/admin/ModerationCard'
import UsersTab from '../components/admin/UsersTab'
import CommentsTab from '../components/admin/CommentsTab'
import useFetch from '../hooks/useFetch'
import useDebounce from '../hooks/useDebounce'
import useAuth from '../hooks/useAuth'
import { formatCount } from '../utils/format'
import {
  fetchAdminStats,
  fetchAdminRices,
  setRiceStatus,
  fetchAdminUsers,
  setUserRole,
  fetchAdminComments,
  deleteComment,
  deleteRice,
} from '../data/mockApi'

const TABS = [
  { key: 'queue', label: 'Queue' },
  { key: 'all-rices', label: 'All Rices' },
  { key: 'users', label: 'Users' },
  { key: 'comments', label: 'Comments' },
]

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'ALL', label: 'ALL STATUSES' },
]

export default function Admin() {
  const { user, token } = useAuth()

  const [tab, setTab] = useState('queue')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [riceSearch, setRiceSearch] = useState('')
  const [commentRiceId, setCommentRiceId] = useState('')
  const debouncedRiceSearch = useDebounce(riceSearch, 300)
  const debouncedUserSearch = useDebounce(search, 300)

  // The queue goes stale as soon as anyone submits while you're sitting on the
  // tab, so REFRESH bumps this counter and hands it to useFetch to force a
  // refetch. See useFetch for why this isn't a useCallback dep.
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((n) => n + 1)

  // One fetch per tab, each fetcher referentially stable so useFetch doesn't
  // loop. Only the active tab's fetcher is mounted below. Refetching is driven
  // by the `refreshKey` argument to useFetch, NOT by putting it in these dep
  // arrays: React Compiler drops deps a callback never reads, which would
  // leave these identities stable and make refreshKey inert.
  const loadStats = useCallback(() => fetchAdminStats(token), [token])
  const loadQueue = useCallback(
    () => fetchAdminRices({ status: 'PENDING', search: debouncedRiceSearch }, token),
    [token, debouncedRiceSearch],
  )
  const loadAllRices = useCallback(
    () => fetchAdminRices({ status: statusFilter, search: debouncedRiceSearch }, token),
    [token, statusFilter, debouncedRiceSearch],
  )
  const loadUsers = useCallback(
    () =>
      fetchAdminUsers(
        { search: debouncedUserSearch, role: roleFilter === 'ALL' ? undefined : roleFilter },
        token,
      ),
    [token, debouncedUserSearch, roleFilter],
  )
  const loadComments = useCallback(
    () => fetchAdminComments({ riceId: commentRiceId.trim() || undefined }, token),
    [token, commentRiceId],
  )

  const { data: stats, loading: statsLoading, error: statsError } = useFetch(loadStats, refreshKey)

  const activeLoad =
    tab === 'queue' ? loadQueue : tab === 'all-rices' ? loadAllRices : tab === 'users' ? loadUsers : loadComments
  const { data: panelData, loading: panelLoading, error: panelError } = useFetch(activeLoad, refreshKey)

  // Mutations patch local overlays instead of refetching (useFetch has no
  // refetch API). Remounting a tab's panel resets its overlays.
  const [removedRiceIds, setRemovedRiceIds] = useState([])
  const [riceStatusOverrides, setRiceStatusOverrides] = useState({})
  const [roleOverrides, setRoleOverrides] = useState({})
  const [removedCommentIds, setRemovedCommentIds] = useState([])

  const handleSetStatus = async (rice, status) => {
    const updated = await setRiceStatus(rice._id, status, token)
    setRiceStatusOverrides((prev) => ({ ...prev, [rice._id]: updated }))
    // Approved work leaves the PENDING queue.
    if (tab === 'queue') setRemovedRiceIds((prev) => [...prev, rice._id])
  }

  const handleDeleteRice = async (rice) => {
    await deleteRice(rice._id, token)
    setRemovedRiceIds((prev) => [...prev, rice._id])
  }

  const handleSetRole = async (target, role) => {
    const updated = await setUserRole(target.id, role, token)
    setRoleOverrides((prev) => ({ ...prev, [target.id]: { ...target, ...updated } }))
  }

  const handleDeleteComment = async (comment) => {
    await deleteComment(comment._id, token)
    setRemovedCommentIds((prev) => [...prev, comment._id])
  }

  const rices = (panelData?.rices || [])
    .filter((rice) => !removedRiceIds.includes(rice._id))
    .map((rice) => riceStatusOverrides[rice._id] ?? rice)

  const users = (panelData?.users || []).map((u) => roleOverrides[u.id] ?? u)

  const comments = (panelData?.comments || []).filter(
    (c) => !removedCommentIds.includes(c._id),
  )

  const stats_ = stats?.rices
  const statCards = [
    { label: 'Total Rices', value: formatCount(stats_?.total), accent: 'border-primary' },
    { label: 'Pending', value: formatCount(stats_?.pending), accent: 'border-warning-orange' },
    { label: 'Users', value: formatCount(stats?.users?.total), accent: 'border-neon-cyan' },
    { label: 'Comments', value: formatCount(stats?.comments?.total), accent: 'border-terminal-green' },
  ]

  return (
    <Layout>
      <div className="relative overflow-hidden bg-surface-container-highest px-4 py-12 lg:px-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-terminal-green/5 blur-[100px]" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-terminal-green">
                root@ricehub:~/admin
              </span>
              <span className="cursor-blink h-4 w-2 bg-terminal-green" />
            </div>
            <h1 className="font-display text-4xl font-bold uppercase tracking-tighter text-on-surface lg:text-5xl">
              Admin Panel
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">
              Moderate submissions, manage account roles, and purge comment
              abuse.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`border-l-2 ${card.accent} bg-surface-container px-6 py-4`}
              >
                <span className="mb-1 block font-mono text-xs uppercase text-on-surface-variant">
                  {card.label}
                </span>
                <span className="font-display text-2xl font-bold text-on-surface">
                  {statsLoading ? '—' : card.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-20 z-40 border-b-2 border-outline-variant bg-background px-4 lg:px-12">
        <div className="flex flex-wrap gap-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative py-6 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === t.key ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
              <span
                className={`absolute bottom-0 left-0 h-[3px] w-full bg-terminal-green transition-transform origin-left ${
                  tab === t.key ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-12 lg:px-12">
        {statsError && (
          <p className="mb-6 border-2 border-error bg-surface-container p-6 font-mono text-sm text-error">
            &gt; ERR: {statsError}
          </p>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 border-b border-outline-variant pb-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-4 font-mono text-sm text-on-surface-variant">
            <span>
              {panelLoading
                ? '> QUERYING...'
                : `> ${panelData?.total ?? 0} RESULT${panelData?.total === 1 ? '' : 'S'}`}
            </span>
            <button
              type="button"
              onClick={refresh}
              disabled={panelLoading}
              className="flex items-center gap-1 border-2 border-outline px-2 py-1 text-[10px] uppercase transition-colors hover:border-terminal-green hover:text-terminal-green disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </button>
          </span>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {tab === 'queue' && (
              <input
                value={riceSearch}
                onChange={(e) => setRiceSearch(e.target.value)}
                placeholder="grep title/description..."
                className="border-2 border-outline bg-surface-container px-3 py-2 font-mono text-xs text-on-surface placeholder:text-on-surface-variant focus:border-terminal-green focus:outline-none"
              />
            )}

            {tab === 'all-rices' && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="cursor-pointer border-2 border-outline bg-surface-container px-3 py-2 font-mono text-xs uppercase text-on-surface focus:border-terminal-green focus:outline-none"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <input
                  value={riceSearch}
                  onChange={(e) => setRiceSearch(e.target.value)}
                  placeholder="grep title/description..."
                  className="border-2 border-outline bg-surface-container px-3 py-2 font-mono text-xs text-on-surface placeholder:text-on-surface-variant focus:border-terminal-green focus:outline-none"
                />
              </>
            )}

            {tab === 'users' && (
              <>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="grep handle/email..."
                  className="border-2 border-outline bg-surface-container px-3 py-2 font-mono text-xs text-on-surface placeholder:text-on-surface-variant focus:border-terminal-green focus:outline-none"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="cursor-pointer border-2 border-outline bg-surface-container px-3 py-2 font-mono text-xs uppercase text-on-surface focus:border-terminal-green focus:outline-none"
                >
                  <option value="ALL">ALL ROLES</option>
                  <option value="admin">ADMINS</option>
                  <option value="user">USERS</option>
                </select>
              </>
            )}

            {tab === 'comments' && (
              <input
                value={commentRiceId}
                onChange={(e) => setCommentRiceId(e.target.value)}
                placeholder="filter by rice id (optional)"
                className="border-2 border-outline bg-surface-container px-3 py-2 font-mono text-xs text-on-surface placeholder:text-on-surface-variant focus:border-terminal-green focus:outline-none"
              />
            )}
          </div>
        </div>

        {panelError && (
          <p className="border-2 border-error bg-surface-container p-6 font-mono text-sm text-error">
            &gt; ERR: {panelError}
          </p>
        )}

        {panelLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <div
                key={key}
                className="h-[420px] animate-pulse border-2 border-outline bg-surface-container"
              />
            ))}
          </div>
        )}

        {!panelLoading && !panelError && (tab === 'queue' || tab === 'all-rices') && (
          <section className="flex flex-col gap-6">
            {rices.length === 0 ? (
              <p className="border-2 border-dashed border-outline-variant p-10 text-center font-mono text-sm text-on-surface-variant">
                &gt; QUEUE_EMPTY — NOTHING_AWAITING_REVIEW_
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rices.map((rice) => (
                  <ModerationCard
                    key={rice._id}
                    rice={rice}
                    onSetStatus={handleSetStatus}
                    onDelete={handleDeleteRice}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {!panelLoading && !panelError && tab === 'users' && (
          <UsersTab users={users} currentUserId={user?.id} onSetRole={handleSetRole} />
        )}

        {!panelLoading && !panelError && tab === 'comments' && (
          <CommentsTab comments={comments} onDelete={handleDeleteComment} />
        )}
      </div>
    </Layout>
  )
}
