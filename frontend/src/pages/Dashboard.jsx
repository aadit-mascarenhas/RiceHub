import { useState, useCallback } from 'react'
import Layout from '../components/Layout'
import DashboardCard from '../components/DashboardCard'
import SavedRiceCard from '../components/SavedRiceCard'
import SubmitRiceCard from '../components/SubmitRiceCard'
import useFetch from '../hooks/useFetch'
import useSavedRices from '../hooks/useSavedRices'
import useAuth from '../hooks/useAuth'
import { fetchRices, fetchMyRices, deleteRice, updateRice } from '../data/mockApi'

export default function Dashboard() {
  const [tab, setTab] = useState('my-rices')
  const { savedIds } = useSavedRices()
  const { user, token } = useAuth()

  // Saved tab keeps the full gallery; My Rices uses the auth-only listing.
  const loadAll = useCallback(() => fetchRices(), [])
  const { data: allRices, loading, error } = useFetch(loadAll)
  const loadMine = useCallback(
    () => (token ? fetchMyRices(token) : Promise.resolve([])),
    [token],
  )
  const { data: mineRices, loading: mineLoading, error: mineError } = useFetch(loadMine)

  // Local overlays so delete/edit reflect without refetching (useFetch has no
  // refetch API and its fetcher must stay referentially stable).
  const [removedIds, setRemovedIds] = useState([])
  const [updatedRices, setUpdatedRices] = useState({})

  const myRices = (mineRices || [])
    .filter((rice) => !removedIds.includes(rice._id))
    .map((rice) => updatedRices[rice._id] ?? rice)
  const savedRices = allRices
    ? allRices.filter((rice) => savedIds.includes(rice._id))
    : []

  const canEdit = (rice) =>
    Boolean(user) && (rice.author === user.handle || user.role === 'admin')

  const handleDelete = async (rice) => {
    await deleteRice(rice._id, token)
    setRemovedIds((prev) => [...prev, rice._id])
  }

  const handleUpdate = async (id, payload) => {
    const updated = await updateRice(id, payload, token)
    setUpdatedRices((prev) => ({ ...prev, [id]: updated }))
  }

  const listLoading = loading || mineLoading
  const listError = error || mineError

  return (
    <Layout>
      <div className="relative overflow-hidden bg-surface-container-highest px-4 py-12 lg:px-12">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-terminal-green/5 blur-[120px]" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-terminal-green">
                usr@ricehub:~
              </span>
              <span className="cursor-blink h-4 w-2 bg-terminal-green" />
            </div>
            <h1 className="font-display text-4xl font-bold uppercase tracking-tighter text-on-surface lg:text-5xl">
              Command Center
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">
              Manage your configurations, track submission status, and organize
              your saved inspirations.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="border-l-2 border-terminal-green bg-surface-container px-6 py-4">
              <span className="mb-1 block font-mono text-xs uppercase text-on-surface-variant">
                TOTAL VIEWS
              </span>
              <span className="font-display text-2xl font-bold text-on-surface">
                {myRices.reduce((sum, r) => sum + (r.views || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="border-l-2 border-primary bg-surface-container px-6 py-4">
              <span className="mb-1 block font-mono text-xs uppercase text-on-surface-variant">
                UPVOTES
              </span>
              <span className="font-display text-2xl font-bold text-on-surface">
                {myRices.reduce((sum, r) => sum + (r.likes?.length || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-20 z-40 border-b-2 border-outline-variant bg-background px-4 lg:px-12">
        <div className="flex gap-8">
          {[
            { key: 'my-rices', label: 'My Rices' },
            { key: 'saved-rices', label: 'Saved Rices' },
          ].map((t) => (
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
        {listError && (
          <p className="border-2 border-error bg-surface-container p-6 font-mono text-sm text-error">
            &gt; ERR: {listError}
          </p>
        )}

        {listLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <div key={key} className="h-[420px] animate-pulse border-2 border-outline bg-surface-container" />
            ))}
          </div>
        )}

        {!listLoading && !listError && tab === 'my-rices' && (
          <section>
            <div className="mb-8 flex items-center justify-between border-b border-outline-variant pb-4">
              <span className="font-mono text-sm text-on-surface-variant">
                {myRices.length} UPLOADS DETECTED
              </span>
              <select className="cursor-pointer border-none bg-background font-mono text-sm text-on-surface outline-none">
                <option>SORT: RECENT</option>
                <option>SORT: POPULAR</option>
                <option>SORT: STATUS</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {myRices.length === 0 ? (
                <p className="col-span-full border-2 border-dashed border-outline-variant p-10 text-center font-mono text-sm text-on-surface-variant">
                  &gt; NO_RICES_YET — SUBMIT_YOUR_FIRST_SETUP_
                </p>
              ) : (
                myRices.map((rice) => (
                  <DashboardCard
                    key={rice._id}
                    rice={rice}
                    canEdit={canEdit(rice)}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))
              )}
              <SubmitRiceCard />
            </div>
          </section>
        )}

        {!listLoading && !listError && tab === 'saved-rices' && (
          <section>
            <div className="mb-8 flex items-center justify-between border-b border-outline-variant pb-4">
              <span className="font-mono text-sm text-on-surface-variant">
                {savedRices.length} SAVED CONFIGS
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedRices.length === 0 ? (
                <p className="col-span-full border-2 border-dashed border-outline-variant p-10 text-center font-mono text-sm text-on-surface-variant">
                  &gt; NO_SAVED_RICES — BOOKMARK_ONE_FROM_BROWSE_
                </p>
              ) : (
                savedRices.map((rice) => (
                  <SavedRiceCard key={rice._id} rice={rice} />
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}
