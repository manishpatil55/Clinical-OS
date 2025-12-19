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
} from "@/components/ui/alert-dialog"

interface User {
    id: string
    username: string
    role: string
    tenant_id: string
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ username: "", password: "", role: "doctor" })
    const [submitting, setSubmitting] = useState(false)

    // Password Reset State
    const [userToReset, setUserToReset] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState("")

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token")
            // Fetch users for *this* tenant. Requires backend support (we might need to add/verify GET /users logic)
            // For now, let's assume GET /users returns scoped users.
            const res = await axios.get("http://localhost:8000/users", {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUsers(res.data)
        } catch (err) {
            console.error("Failed to fetch users", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const token = localStorage.getItem("token")
            await axios.post("http://localhost:8000/users", formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setFormData({ username: "", password: "", role: "doctor" })
            setShowCreate(false)
            fetchUsers()
        } catch (err) {
            alert("Failed to create user: " + ((err as any).response?.data?.detail || (err as any).message))
        } finally {
            setSubmitting(false)
        }
    }

    const handleResetPassword = async () => {
        if (!userToReset || !newPassword) return
        try {
            const token = localStorage.getItem("token")
            await axios.post(`http://localhost:8000/users/${userToReset.id}/reset-password`, { password: newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("Password reset successfully")
            setUserToReset(null)
            setNewPassword("")
        } catch (err) {
            alert("Reset failed: " + ((err as any).response?.data?.detail || (err as any).message))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
                    <p className="text-muted-foreground">Manage doctors, nurses, and staff access.</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                </Button>
            </div>

            {showCreate && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Register New Staff</CardTitle>
                        <CardDescription>Create an account for a new employee.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Username</Label>
                                    <Input
                                        placeholder="e.g. dr_smith"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Initial Password</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="front_desk">Front Desk</option>
                                    <option value="lab_scientist">Lab Scientist</option>
                                    <option value="admin">Clinic Admin</option>
                                </select>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create User
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
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.username}</TableCell>
                                <TableCell className="capitalize badge">{u.role.replace('_', ' ')}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setUserToReset(u)}
                                        title="Reset Password"
                                    >
                                        <Key className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Reset Password Dialog */}
            <AlertDialog open={!!userToReset} onOpenChange={() => setUserToReset(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Password for {userToReset?.username}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter a new password for this user.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetPassword}>Update Password</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
