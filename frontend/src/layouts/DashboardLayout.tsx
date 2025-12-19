import { useState, useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, Users, Settings, LogOut, Building2, Loader2 } from "lucide-react"
import axios from "axios"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface UserContext {
    id: string
    username: string
    role: string
    tenant_name: string
    is_super_admin: boolean
}

export default function DashboardLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const [user, setUser] = useState<UserContext | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    navigate("/login")
                    return
                }
                const res = await axios.get("http://localhost:8000/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setUser(res.data)
            } catch (err) {
                console.error("Failed to fetch user", err)
                localStorage.removeItem("token")
                navigate("/login")
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem("token")
        window.location.href = "/login"
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/", visible: true },
        // Only show "Clinics" to Super Admins
        { icon: Building2, label: "Clinics (Tenants)", href: "/tenants", visible: user?.is_super_admin },
        { icon: Users, label: "User Management", href: "/users", visible: true },
        { icon: Settings, label: "System Settings", href: "/settings", visible: true },
    ]

    return (
        <div className="flex h-screen bg-muted/20">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <span className="bg-primary text-primary-foreground p-1 rounded">C</span>
                        <span>Clinical OS</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {user?.is_super_admin ? "Super Admin Console" : `${user?.tenant_name} Console`}
                    </p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {sidebarItems.filter(i => i.visible).map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <div className="mb-4 px-2">
                        <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
                        <p className="text-sm font-bold truncate">{user?.username}</p>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-16 border-b bg-card flex items-center px-6 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold">
                        {sidebarItems.find(i => i.href === location.pathname)?.label || "Dashboard"}
                    </h1>
                </header>
                <div className="p-6 max-w-7xl mx-auto">
                    {/* Pass User Context to Outlet */}
                    <Outlet context={{ user }} />
                </div>
            </main>
        </div>
    )
}
