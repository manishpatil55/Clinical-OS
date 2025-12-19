import { useOutletContext, Link } from "react-router-dom"
import { Building2, Users, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface UserContext {
    id: string
    username: string
    role: string
    tenant_name: string
    is_super_admin: boolean
}

export default function Overview() {
    const { user } = useOutletContext<{ user: UserContext }>()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome, {user.is_super_admin ? "Super Admin" : user.username}.</h2>
                <p className="text-muted-foreground">
                    {user.is_super_admin
                        ? "Manage your multi-tenant Clinical OS ecosystem."
                        : `Here is what's happening at ${user.tenant_name} today.`}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.is_super_admin ? (
                    // Super Admin Widgets
                    <>
                        <Link to="/tenants">
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">--</div>
                                    <p className="text-xs text-muted-foreground">Active Instances</p>
                                </CardContent>
                            </Card>
                        </Link>
                    </>
                ) : (
                    // Clinic Admin Widgets
                    <>
                        <Link to="/users">
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">--</div>
                                    <p className="text-xs text-muted-foreground">Doctors, Nurses, Staff</p>
                                </CardContent>
                            </Card>
                        </Link>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">Registered Patients</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}
