import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import useAuth from '../hooks/useAuth'

const NAV_LINKS = [
  { to: '/', label: 'Browse', end: true },
  { to: '/dashboard', label: 'Dashboard' },
]

const ADMIN_LINKS = [{ to: '/admin', label: 'Admin' }]

const navLinkClass = ({ isActive }) =>
  isActive
    ? 'font-mono text-xs uppercase tracking-widest text-terminal-green underline decoration-2 underline-offset-8'
    : 'font-mono text-xs uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const closeMenu = () => setMenuOpen(false)
  const isAdmin = user?.role === 'admin'
  const links = isAdmin ? [...NAV_LINKS, ...ADMIN_LINKS] : NAV_LINKS

  return (
    <header className="fixed top-0 z-50 w-full border-b-2 border-outline-variant bg-background">
      <div className="mx-auto flex h-20 max-w-page items-center justify-between gap-6 px-4 lg:px-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-lg font-bold tracking-tight">
            RICE HUB
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 xl:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
          <Link
            to="/submit"
            className="border-2 border-on-primary bg-primary px-4 py-2 font-mono text-xs uppercase tracking-widest text-on-primary shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            Submit
          </Link>
        </nav>

        {/* Auth buttons / hamburger */}
        <div className="flex items-center gap-4 border-l-2 border-outline-variant pl-6">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-terminal-green bg-surface-container">
                  <span className="font-mono text-xs font-bold text-terminal-green">
                    {user.handle.slice(1, 2).toUpperCase()}
                  </span>
                </div>
                <span className="hidden font-mono text-xs uppercase tracking-widest text-on-surface sm:block">
                  {user.handle}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="font-mono text-xs uppercase tracking-widest text-on-surface-variant transition-colors hover:text-warning-orange"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="font-mono text-xs uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Login
            </Link>
          )}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            className="md:hidden"
          >
            <span className="material-symbols-outlined text-on-surface">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="flex flex-col gap-4 border-t-2 border-outline-variant bg-background px-4 py-6 md:hidden">
          {[...links, { to: '/submit', label: 'Submit' }].map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={closeMenu}>
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}