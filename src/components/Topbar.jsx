import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, User as UserIcon, FileText, Eye, Search, Home, ChevronDown } from 'lucide-react'
import { useAuth } from '../lib/auth'

/**
 * Sticky portal navigation. The CTA cluster on the right swaps based on auth
 * state — Login/Register pills when signed-out, a user menu when signed-in —
 * so the hero never shows "register" links to someone already inside.
 */
export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the avatar dropdown when clicking outside.
  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const navItems = user
    ? [
        { to: '/',              label: 'Home',         Icon: Home },
        { to: '/grievance',     label: 'File Grievance', Icon: FileText },
        { to: '/my-grievances', label: 'My Requests',  Icon: Eye },
        { to: '/track',         label: 'Track',        Icon: Search },
      ]
    : [
        { to: '/',              label: 'Home',         Icon: Home },
      ]

  const initial = (user?.name || user?.phone || 'U').charAt(0).toUpperCase()

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#f4f6f8] border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#2b4162] text-white flex items-center justify-center font-bold text-xs sm:text-[15px] group-hover:scale-105 transition-transform shadow-sm">
              M
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="font-bold text-[#2b4162] text-xs sm:text-[15px]">Mylapore</div>
              <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-[0.1em] font-bold mt-0.5">Constituency Portal</div>
            </div>
          </Link>

          {/* Desktop nav - CENTERED */}
          <nav className="hidden md:flex items-center gap-0.5 md:gap-1 flex-1 justify-center">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2b4162] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#2b4162] hover:bg-gray-100/50'
                  }`
                }
              >
                <Icon className="w-3 md:w-3.5 h-3 md:h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Auth cluster */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-[13px] font-semibold text-navy hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg md:rounded-xl text-xs sm:text-[13px] font-bold bg-gradient-to-r from-navy to-navy-mid text-white hover:shadow-md transition-all shadow-sm"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1 sm:gap-2 pl-0.5 sm:pl-1.5 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-full hover:bg-gray-100/50 transition-all border border-transparent hover:border-gray-200"
                >
                  <span className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-[#2b4162] text-white flex items-center justify-center text-xs sm:text-[13px] font-bold shadow-sm flex-shrink-0">
                    {initial}
                  </span>
                  <span className="hidden sm:inline text-xs sm:text-[13px] font-semibold text-gray-700 max-w-[100px] sm:max-w-[140px] truncate">
                    {user.name || user.phone}
                  </span>
                  <ChevronDown className={`hidden sm:block w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-400 transition-transform flex-shrink-0 ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 sm:mt-2 w-56 sm:w-64 rounded-lg sm:rounded-2xl bg-white border border-gray-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3.5 bg-gradient-to-r from-navy to-navy-mid">
                      <div className="text-xs sm:text-[13px] font-bold text-white truncate">{user.name || 'Member'}</div>
                      <div className="text-[10px] sm:text-[11px] text-white/70 mt-0.5">+{user.phone}</div>
                      {user.epic && (
                        <div className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">EPIC: {user.epic}</div>
                      )}
                    </div>
                    <div className="py-0.5 sm:py-1">
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); navigate('/my-grievances') }}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 sm:gap-2.5 transition-colors"
                      >
                        <UserIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 flex-shrink-0" /> <span>My Requests</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); navigate('/track') }}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 sm:gap-2.5 transition-colors"
                      >
                        <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 flex-shrink-0" /> <span>Track Grievance</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 sm:gap-2.5 transition-colors"
                      >
                        <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" /> <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 sm:w-5 h-4 sm:h-5" /> : <Menu className="w-4 sm:w-5 h-4 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-50 bg-white shadow-lg">
          <nav className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-0.5">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    isActive ? 'bg-navy text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                {label}
              </NavLink>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="mt-0.5 sm:mt-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold text-navy bg-gray-50 text-center hover:bg-gray-100 transition-colors"
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
