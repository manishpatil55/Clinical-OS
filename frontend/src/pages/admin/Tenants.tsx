import { useState, useEffect } from "react"
import axios from "axios"
import { Plus, Loader2, Key, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Tenant {
    id: string
    name: string
    domain: string
    is_super_admin: boolean
}

export default function Tenants() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ name: "", admin_username: "", admin_password: "" })
    const [submitting, setSubmitting] = useState(false)

    // Dialog States
    const [tenantToImpersonate, setTenantToImpersonate] = useState<Tenant | null>(null)
    const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)

    const fetchTenants = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get("http://127.0.0.1:8000/tenants", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setTenants(res.data)
        } catch (err) {
            console.error("Failed to fetch tenants", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTenants()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const token = localStorage.getItem("token")
            await axios.post("http://127.0.0.1:8000/tenants", formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setFormData({ name: "", admin_username: "", admin_password: "" })
            setShowCreate(false)
            fetchTenants()
        } catch (err) {
            alert("Failed to create tenant: " + ((err as any).response?.data?.detail || (err as any).message))
        } finally {
            setSubmitting(false)
        }
    }

    const handleImpersonate = async () => {
        if (!tenantToImpersonate) return
        try {
            const token = localStorage.getItem("token")
            const res = await axios.post(`http://127.0.0.1:8000/tenants/${tenantToImpersonate.id}/impersonate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            localStorage.setItem("token", res.data.access_token)
            window.location.href = "/"
        } catch (err) {
            alert("Impersonation failed: " + ((err as any).response?.data?.detail || (err as any).message))
        } finally {
            setTenantToImpersonate(null)
        }
    }

    const handleDelete = async () => {
        if (!tenantToDelete) return
        try {
            const token = localStorage.getItem("token")
            await axios.delete(`http://127.0.0.1:8000/tenants/${tenantToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchTenants()
        } catch (err) {
            alert("Delete failed: " + ((err as any).response?.data?.detail || (err as any).message))
        } finally {
            setTenantToDelete(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clinics</h2>
                    <p className="text-muted-foreground">Manage the hospitals and clinics in your system.</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Clinic
                </Button>
            </div>

            {showCreate && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Register New Clinic</CardTitle>
                        <CardDescription>Deploy a new instance of Clinical OS.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid gap-2">
                                    <Label>Clinic Name</Label>
                                    <Input
                                        placeholder="e.g. Apollo Hospital"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Admin Username</Label>
                                    <Input
                                        placeholder="e.g. apollo_admin"
                                        value={formData.admin_username}
                                        onChange={(e) => setFormData({ ...formData, admin_username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Admin Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.admin_password}
                                        onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create Instance & Admin
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Clinic Name</TableHead>
                            <TableHead>Admin Username</TableHead>
                            <TableHead>Domain ID</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : tenants.map((tenant) => (
                            <TableRow key={tenant.id}>
                                <TableCell className="font-medium">
                                    {tenant.name}
                                    {tenant.is_super_admin && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">HQ</span>}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                        {(tenant as any).admin_username || "N/A"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{tenant.domain || "N/A"}</TableCell>
                                <TableCell className="text-right">
                                    {!tenant.is_super_admin && (
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTenantToImpersonate(tenant)}
                                                title="Login as Owner"
                                            >
                                                <Key className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTenantToDelete(tenant)}
                                                title="Delete Clinic"
                                            >
                                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Impersonation Dialog */}
            <AlertDialog open={!!tenantToImpersonate} onOpenChange={() => setTenantToImpersonate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Login as {tenantToImpersonate?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will be logged out of your Super Admin account and logged in as the Administrator for this clinic.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleImpersonate}>Yes, Login</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!tenantToDelete} onOpenChange={() => setTenantToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {tenantToDelete?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the clinic and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
