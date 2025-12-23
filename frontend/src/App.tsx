import Login from "./pages/Login"
import DashboardLayout from "./layouts/DashboardLayout"
import Overview from "./pages/admin/Overview"
import Tenants from "./pages/admin/Tenants"
import Users from "./pages/admin/Users"
import Settings from "./pages/admin/Settings"

// Protected Route Wrapper
import Appointments from "@/pages/admin/Appointments"
import Patients from "@/pages/admin/Patients" // Added Patients import as it's used in the new routes
import PatientProfile from "@/pages/admin/PatientProfile"
import LabImport from "@/pages/admin/LabImport"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom" // Updated router imports

// Removed ProtectedRoute Wrapper as it's no longer used in the new App structure

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Protected Dashboard Area - now handled by nesting routes under DashboardLayout */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/users" element={<Users />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientProfile />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/lab-import" element={<LabImport />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
