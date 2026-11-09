import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './layouts/AdminLayout'
import { ParentLayout } from './layouts/ParentLayout'
import { AdminClassesPage } from './pages/admin/AdminClassesPage'
import { ApplicationPage } from './pages/ApplicationPage'
import { ClassListPage } from './pages/ClassListPage'
import { MyApplicationsPage } from './pages/MyApplicationsPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Parent portal: classes, applications, student ID. */}
      <Route element={<ParentLayout />}>
        <Route index element={<ClassListPage />} />
        <Route path="applications/:holdId" element={<ApplicationPage />} />
        <Route path="my-applications" element={<MyApplicationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* School admin console: its own layout, no student ID. */}
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminClassesPage />} />
        {/* Old create-class page: now the New class dialog on the admin home. */}
        <Route path="classes/new" element={<Navigate to="/admin?new=1" replace />} />
        <Route path="*" element={<NotFoundPage homePath="/admin" homeLabel="Go to the admin console" />} />
      </Route>
    </Routes>
  )
}
