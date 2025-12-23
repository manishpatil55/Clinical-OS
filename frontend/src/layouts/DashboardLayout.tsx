import { useState, useEffect } from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, Users, Building2, Menu, LogOut, Settings, Calendar, Import } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import axios from "axios"

interface UserContext {
    id: string
    username: string
    roles: string[]
    tenant_name: string
    is_super_admin: boolean
}

export default function DashboardLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [user, setUser] = useState<UserContext | null>(null)
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    navigate("/login")
                    return
                }
                const res = await axios.get("http://127.0.0.1:8000/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setUser(res.data)
            } catch (err) {
                localStorage.removeItem("token")
                navigate("/login")
            }
        }
        fetchUser()
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem("token")
        navigate("/login")
    }

    if (!user) return <div className="flex h-screen items-center justify-center"><h2 className="animate-pulse text-xl">Loading Clinical OS...</h2></div>

    // Define sidebar items with visibility logic
    const sidebarItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/", visible: true },
        // CLINICAL ITEMS
        { icon: Calendar, label: "Appointments", href: "/appointments", visible: !user?.is_super_admin },
        { icon: Users, label: "Patients", href: "/patients", visible: !user?.is_super_admin }, // Front Desk needs to register/find patients
        { icon: Import, label: "Lab Import", href: "/lab-import", visible: !user?.is_super_admin && user?.roles?.some(r => ["admin", "doctor", "nurse"].includes(r)) }, // No Front Desk

        // PLATFORM ITEMS
        { icon: Building2, label: "Clinics (Tenants)", href: "/tenants", visible: user?.is_super_admin },

        // ADMIN ITEMS
        { icon: Users, label: "Staff Management", href: "/users", visible: !user?.is_super_admin && user?.roles?.includes("admin") },
        { icon: Settings, label: "System Settings", href: "/settings", visible: user?.is_super_admin || user?.roles?.includes("admin") },
    ]

    return (
        <div className="flex h-screen w-full bg-muted/40">
            {/* Sidebar (Desktop) */}
            <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
                <div className="flex h-14 items-center border-b px-6">
                    <Link to="/" className="flex items-center gap-2 font-semibold">
                        {(user as any).logo_url ? (
                            <img src={(user as any).logo_url} alt="Logo" className="h-8 w-8 object-contain" />
                        ) : (
                            <Building2 className="h-6 w-6" />
                        )}
                        <span className="truncate max-w-[150px]" title={user.tenant_name}>{user.tenant_name}</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {sidebarItems.map((item, index) => (
                            item.visible && (
                                <Link
                                    key={index}
                                    to={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${location.pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"}`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        ))}
                    </nav>
                </div>
                <div className="mt-auto border-t p-4 space-y-4">
                    <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Powered by</p>
                        <p className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                            Clinical OS
                        </p>
                    </div>
                    <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header + Content */}
            <div className="flex flex-col flex-1">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <nav className="grid gap-2 text-lg font-medium">
                                <Link to="#" className="flex items-center gap-2 text-lg font-semibold">
                                    {(user as any).logo_url ? (
                                        <img src={(user as any).logo_url} alt="Logo" className="h-8 w-8 object-contain" />
                                    ) : (
                                        <Building2 className="h-6 w-6" />
                                    )}
                                    <span>{user.tenant_name}</span>
                                </Link>
                                {sidebarItems.map((item, index) => (
                                    item.visible && (
                                        <Link
                                            key={index}
                                            to={item.href}
                                            className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </Link>
                                    )
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1">
                        <h1 className="text-lg font-semibold">{user.tenant_name}</h1>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
                    {/* Pass user context to child pages (Overview, etc) */}
                    <Outlet context={{ user }} />
                </main>
            </div>
        </div>
    )
}
