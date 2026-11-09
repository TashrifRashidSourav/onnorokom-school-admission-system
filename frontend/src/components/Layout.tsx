import { NavLink, Outlet } from 'react-router'
import { config } from '../config'
import { StudentIdBar } from '../student/StudentIdBar'

const navItems = [
  { to: '/', label: 'Classes', end: true },
  { to: '/my-applications', label: 'My applications', end: false },
  { to: '/admin/classes/new', label: 'Create class (admin)', end: false },
]

export function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <span className="app-brand">School Admission</span>
          <nav className="app-nav" aria-label="Main">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="app-header__student">
          <StudentIdBar />
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        API: <code>{config.apiUrl}</code>
      </footer>
    </div>
  )
}
