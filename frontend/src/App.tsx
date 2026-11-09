import { Route, Routes } from 'react-router'
import { ParentLayout } from './layouts/ParentLayout'
import { ApplicationPage } from './pages/ApplicationPage'
import { ClassListPage } from './pages/ClassListPage'
import { CreateClassPage } from './pages/CreateClassPage'
import { MyApplicationsPage } from './pages/MyApplicationsPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<ParentLayout />}>
        <Route index element={<ClassListPage />} />
        <Route path="admin/classes/new" element={<CreateClassPage />} />
        <Route path="applications/:holdId" element={<ApplicationPage />} />
        <Route path="my-applications" element={<MyApplicationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
