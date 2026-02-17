import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const close = () => setSidebarOpen(false)

  return (
    <div className={`app-shell${sidebarExpanded ? ' sidebar-expanded' : ''}`}>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={close}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={close}
        onExpand={() => setSidebarExpanded(true)}
        onCollapse={() => setSidebarExpanded(false)}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Header onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
