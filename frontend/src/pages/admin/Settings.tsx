import { useState, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import axios from "axios"
import { Building2, Save, Upload, ShieldCheck, Globe, Phone, MapPin, Plus, Loader2, Trash2, Key } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// --- TYPES ---
interface Settings {
    tenant_id?: string
    clinic_name: string
    logo_url: string
    address: string
    phone: string
    website: string
}

interface User {
    id: string
    username: string
    roles: string[]
    is_active: boolean
}

// --- MAIN COMPONENT ---
export default function Settings() {
    const { user } = useOutletContext<any>()

    if (user.is_super_admin) {
        return <SuperAdminSettings />
    } else {
        return <ClinicSettings />
    }
}

// --- SUPER ADMIN VIEW ---
function SuperAdminSettings() {
    const { user: currentUser } = useOutletContext<any>()
    const [admins, setAdmins] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState<Settings>({
        clinic_name: "Clinical OS", // Default
        logo_url: "", address: "", phone: "", website: ""
    })

    // Action States
    const [showAdd, setShowAdd] = useState(false)
    const [newAdmin, setNewAdmin] = useState({ username: "", password: "" })
    const [submitting, setSubmitting] = useState(false)
    const [savingSettings, setSavingSettings] = useState(false)

    // Action States
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [userToReset, setUserToReset] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token")
            const [usersRes, settingsRes] = await Promise.all([
                axios.get("http://127.0.0.1:8000/users", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("http://127.0.0.1:8000/settings", { headers: { Authorization: `Bearer ${token}` } })
            ])
            setAdmins(usersRes.data)
            if (settingsRes.data) {
                setSettings({
                    clinic_name: settingsRes.data.clinic_name || "Clinical OS",
                    logo_url: settingsRes.data.logo_url || "",
                    address: settingsRes.data.address || "",
                    phone: settingsRes.data.phone || "",
                    website: settingsRes.data.website || ""
                })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAdmins = async () => {
        // simplified refresh for just users
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get("http://127.0.0.1:8000/users", { headers: { Authorization: `Bearer ${token}` } })
            setAdmins(res.data)
        } catch (e) { }
    }

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const token = localStorage.getItem("token")
            await axios.post("http://127.0.0.1:8000/users", {
                username: newAdmin.username,
                password: newAdmin.password,
                roles: ["admin"] // Platform Admins are just admins of the HQ tenant
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setNewAdmin({ username: "", password: "" })
            setShowAdd(false)
            fetchAdmins()
        } catch (err: any) {
            console.error(err)
            alert("Failed to add admin: " + (err.response?.data?.detail || err.message))
        } finally {
            setSubmitting(false)
        }
    }

    const handleSaveGlobal = async () => {
        setSavingSettings(true)
        try {
            const token = localStorage.getItem("token")
            await axios.patch("http://127.0.0.1:8000/settings", settings, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("Global settings saved.")
        } catch (err) {
            alert("Failed to save settings")
        } finally {
            setSavingSettings(false)
        }
    }

    // ... (rest of DELETE/RESET handlers same as before)
    const handleDeleteUser = async () => {
        if (!userToDelete) return
        try {
            const token = localStorage.getItem("token")
            await axios.delete(`http://127.0.0.1:8000/users/${userToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchAdmins()
        } catch (err) {
            alert("Failed to delete user: " + ((err as any).response?.data?.detail || "Unknown error"))
        } finally {
            setUserToDelete(null)
        }
    }

    const handleResetPassword = async () => {
        if (!userToReset) return
        try {
            const token = localStorage.getItem("token")
            await axios.post(`http://127.0.0.1:8000/users/${userToReset.id}/reset-password`, {
                password: newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("Password updated successfully")
        } catch (err) {
            alert("Failed to update password")
        } finally {
            setUserToReset(null)
            setNewPassword("")
        }
    }


    // Only "admin" (The Root) can manage other Super Admins
    const canManage = currentUser.username === "admin"

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Configuration</h2>
                <p className="text-muted-foreground">Manage Global Admins and System Preferences.</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium">Super Administrators</h3>
                        <p className="text-sm text-muted-foreground">These users have full access to the Platform Control Center.</p>
                    </div>
                    <Button onClick={() => setShowAdd(!showAdd)} variant={showAdd ? "secondary" : "default"}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Admin
                    </Button>
                </div>

                {showAdd && (
                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="pt-6">
                            <form onSubmit={handleAddAdmin} className="flex gap-4 items-end">
                                <div className="grid gap-2 flex-1">
                                    <Label>Username</Label>
                                    <Input
                                        value={newAdmin.username}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                        placeholder="new_admin"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2 flex-1">
                                    <Label>Password</Label>
                                    <Input
                                        type="password"
                                        value={newAdmin.password}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                        placeholder="••••••"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create User
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                {canManage && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">{admin.username}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                            Super Admin
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex h-2 w-2 rounded-full ${admin.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </TableCell>
                                    {canManage && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setUserToReset(admin)}
                                                    title="Reset Password"
                                                >
                                                    <Key className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                </Button>

                                                {admin.username !== "admin" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setUserToDelete(admin)}
                                                        title="Delete Admin"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Super Admin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{userToDelete?.username}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                            Remove Admin
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reset Password Dialog */}
            <AlertDialog open={!!userToReset} onOpenChange={() => setUserToReset(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Password for {userToReset?.username}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter a new password for this administrator.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password..."
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetPassword}>
                            Update Password
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// --- CLINIC ADMIN VIEW (Restored) ---
function ClinicSettings() {
    const [settings, setSettings] = useState<Settings>({
        clinic_name: "",
        logo_url: "",
        address: "",
        phone: "",
        website: ""
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get("http://127.0.0.1:8000/settings", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.data) {
                setSettings({
                    clinic_name: res.data.clinic_name || "",
                    logo_url: res.data.logo_url || "",
                    address: res.data.address || "",
                    phone: res.data.phone || "",
                    website: res.data.website || ""
                })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMsg(null)
        try {
            const token = localStorage.getItem("token")
            await axios.patch("http://127.0.0.1:8000/settings", settings, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setMsg({ type: 'success', text: "Settings saved successfully." })
        } catch (err) {
            setMsg({ type: 'error', text: "Failed to save settings." })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Clinic Settings</h2>
                <p className="text-muted-foreground">Manage your clinic's profile and preferences.</p>
            </div>

            {msg && (
                <Alert variant={msg.type === 'success' ? 'default' : 'destructive'} className={msg.type === 'success' ? "border-green-500 text-green-700 bg-green-50" : ""}>
                    <AlertTitle>{msg.type === 'success' ? "Success" : "Error"}</AlertTitle>
                    <AlertDescription>{msg.text}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="general">Details</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSave}>
                    <TabsContent value="branding" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Clinic Identity</CardTitle>
                                <CardDescription>This information will appear on Prescriptions and Invoices.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="clinic_name">Clinic Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="clinic_name"
                                            name="clinic_name"
                                            className="pl-8"
                                            value={settings.clinic_name}
                                            onChange={handleChange}
                                            placeholder="e.g. City Health Clinic"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="logo_url">Logo URL (Optional)</Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Upload className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="logo_url"
                                                name="logo_url"
                                                className="pl-8"
                                                value={settings.logo_url}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Paste a URL to your logo image.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Card */}
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Preview Header</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 bg-white p-4 rounded-md border shadow-sm">
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="Logo" className="h-12 w-12 object-contain" />
                                    ) : (
                                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground">Logo</div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg">{settings.clinic_name || "Clinic Name"}</h3>
                                        <p className="text-sm text-muted-foreground">{settings.address || "123 Street, City"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="general" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                                <CardDescription>How patients can reach you.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Textarea
                                            id="address"
                                            name="address"
                                            className="pl-8 min-h-[80px]"
                                            value={settings.address}
                                            onChange={handleChange}
                                            placeholder="123 Medical Plaza, Suite 400..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                className="pl-8"
                                                value={settings.phone}
                                                onChange={handleChange}
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="website">Website</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="website"
                                                name="website"
                                                className="pl-8"
                                                value={settings.website}
                                                onChange={handleChange}
                                                placeholder="www.clinic.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                                    <CardTitle>Security & Compliance</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground bg-muted/20">
                                    Role-Based Access Control (RBAC) is active.
                                    <br />
                                    This tenant is secured with JWT Authentication.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                        </Button>
                    </div>
                </form>
            </Tabs>
        </div>
    )
}
