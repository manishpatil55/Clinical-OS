import { useState, useEffect } from "react"
import { useOutletContext, Link } from "react-router-dom"
import axios from "axios"
import { Building2, Users, FileText, Activity, Calendar, TrendingUp, ArrowUpRight, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from "@/components/ui/button"

interface UserContext {
    id: string
    username: string
    roles: string[]
    tenant_name: string
    is_super_admin: boolean
}

interface Stats {
    total_patients: number
    total_staff: number
    today_appointments?: number
    total_tenants?: number // For Super Admin
}

const mockGrowthData = [
    { name: 'Jan', clinics: 2 },
    { name: 'Feb', clinics: 3 },
    { name: 'Mar', clinics: 5 },
    { name: 'Apr', clinics: 8 },
    { name: 'May', clinics: 12 },
    { name: 'Jun', clinics: 15 },
    { name: 'Jul', clinics: 15 },
];

export default function Overview() {
    const { user } = useOutletContext<{ user: UserContext }>()
    const [stats, setStats] = useState<Stats>({ total_patients: 0, total_staff: 0, today_appointments: 0 })
    const [recentTenants, setRecentTenants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [growthData, setGrowthData] = useState<any[]>([])

    useEffect(() => {
        fetchStats()
        if (user.is_super_admin) {
            fetchTenants()
            fetchGrowth()
        }
    }, [user])

    const fetchGrowth = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get("http://127.0.0.1:8000/stats/growth", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setGrowthData(res.data)
        } catch (e) { console.error(e) }
    }

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get("http://127.0.0.1:8000/stats/overview", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStats(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get("http://127.0.0.1:8000/tenants", {
                headers: { Authorization: `Bearer ${token}` }
            })
            // Take last 3
            setRecentTenants(res.data.slice(-3).reverse())
        } catch (err) {
            console.error(err)
        }
    }

    // --- SUPER ADMIN DASHBOARD ---
    if (user.is_super_admin) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
                        <p className="text-muted-foreground mt-1">
                            Live production metrics for <strong>Clinical OS</strong>.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-2" /> Download Report
                        </Button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Link to="/tenants">
                        <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Clinics</CardTitle>
                                <Building2 className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.total_tenants || 0}</div>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    Software Instances
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="border-l-4 border-l-green-500 shadow-sm transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                            <Activity className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_patients || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Across entire ecosystem</p>
                        </CardContent>
                    </Card>

                    <Link to="/tenants">
                        <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-purple-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Hospital Admins</CardTitle>
                                <ShieldCheck className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stats.total_staff || 0}</div>
                                <p className="text-xs text-muted-foreground mt-1">Clinic Administrators</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Charts & Activity Section */}
                <div className="grid gap-4 md:grid-cols-7">
                    {/* Chart */}
                    <Card className="col-span-4 shadow-sm">
                        <CardHeader>
                            <CardTitle>Platform Growth</CardTitle>
                            <CardDescription>New clinics onboarded over time</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData.length > 0 ? growthData : mockGrowthData}>
                                        <defs>
                                            <linearGradient id="colorClinics" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="clinics" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClinics)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="col-span-3 shadow-sm">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest system events</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {recentTenants.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                                ) : recentTenants.map((t, i) => (
                                    <div className="flex items-center" key={t.id}>
                                        <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full items-center justify-center bg-blue-100 text-blue-600 font-bold border">
                                            {t.name[0]}
                                        </span>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">New Clinic Joined</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t.name} was onboarded.
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground">Just now</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6">
                                <Button variant="outline" className="w-full" asChild>
                                    <Link to="/tenants">View All Clinics</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // --- CLINIC ADMIN / STAFF DASHBOARD (Original preserved) ---
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome, {user.username}.</h2>
                <p className="text-muted-foreground">Overview for {user.tenant_name}.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.roles?.includes("admin") && (
                    <Link to="/users">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_staff}</div>
                                <p className="text-xs text-muted-foreground">Doctors, Nurses, Staff</p>
                            </CardContent>
                        </Card>
                    </Link>
                )}

                <Link to="/patients">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_patients}</div>
                            <p className="text-xs text-muted-foreground">Registered Patients</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/appointments">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today_appointments}</div>
                            <p className="text-xs text-muted-foreground">Scheduled for today</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
