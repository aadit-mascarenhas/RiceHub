import { useState } from 'react'

const ROLE_STYLES = {
  admin: 'border-terminal-green text-terminal-green',
  user: 'border-outline text-on-surface-variant',
}

export default function UsersTab({ users, currentUserId, onSetRole }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const handleToggle = async (target) => {
    const nextRole = target.role === 'admin' ? 'user' : 'admin'
    setBusyId(target.id)
    setError(null)
    try {
      await onSetRole(target, nextRole)
    } catch (err) {
      setError(err.message || 'ROLE_UPDATE_FAILED')
    } finally {
      setBusyId(null)
    }
  }

  if (users.length === 0) {
    return (
      <p className="border-2 border-dashed border-outline-variant p-10 text-center font-mono text-sm text-on-surface-variant">
        &gt; NO_USERS_MATCH_
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      {error && (
        <p className="border-2 border-error bg-surface-container p-4 font-mono text-sm text-error">
          &gt; ERR: {error}
        </p>
      )}
      <div className="overflow-x-auto border-2 border-outline">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-outline bg-surface-container">
              {['HANDLE', 'EMAIL', 'ROLE', 'JOINED', ''].map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 font-mono text-xs uppercase tracking-widest text-on-surface-variant"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId
              const busy = busyId === u.id
              return (
                <tr
                  key={u.id}
                  className="border-b border-outline-variant bg-surface-container-low last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-sm text-terminal-green">
                    {u.handle}
                    {isSelf && (
                      <span className="ml-2 font-mono text-[10px] uppercase text-on-surface-variant">
                        (you)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block border px-2 py-1 font-mono text-[10px] uppercase ${
                        ROLE_STYLES[u.role] || ROLE_STYLES.user
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggle(u)}
                      // The API refuses to demote your own account; disable it
                      // here so the rule is visible instead of a 400 on click.
                      disabled={busy || isSelf}
                      title={
                        isSelf
                          ? 'You cannot change your own role'
                          : u.role === 'admin'
                            ? 'Demote to user'
                            : 'Promote to admin'
                      }
                      className="border-2 border-outline px-3 py-1 font-mono text-[10px] uppercase text-on-surface transition-colors hover:border-terminal-green hover:text-terminal-green disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-outline disabled:hover:text-on-surface"
                    >
                      {busy ? '...' : u.role === 'admin' ? 'DEMOTE' : 'PROMOTE'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
