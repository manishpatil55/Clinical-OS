import { useState, useEffect } from "react"
import { useOutletContext } from "react-router-dom"
import axios from "axios"
import { Plus, Search, KeyRound, Ban, CheckCircle2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const SimpleCheckbox = ({ checked, onCheckedChange, id }: { checked: boolean, onCheckedChange: (c: boolean) => void, id: string }) => (
    <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
    />
)

interface User {
    id: string
    username: string
    roles: string[]
    tenant_id: string
    is_active: boolean
}

interface UserContext {
    id: string
    username: string
    roles: string[]
    tenant_name: string
    is_super_admin: boolean
}

const AVAILABLE_ROLES = ["admin", "doctor", "nurse", "front_desk"]

export default function Users() {
    const { user: currentUser } = useOutletContext<{ user: UserContext }>()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Add User State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newUsername, setNewUsername] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [selectedRoles, setSelectedRoles] = useState<string[]>(["doctor"]) // Default valid role
    const [addError, setAddError] = useState("")

    // Reset Password State
    const [resetUser, setResetUser] = useState<User | null>(null)
    const [resetPasswordInput, setResetPasswordInput] = useState("")

    // Edit User State
    const [editingUser, setEditingUser] = useState<User | null>(null)

    // Delete User State
    const [deleteUser, setDeleteUser] = useState<User | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token")
            // SUPER ADMIN: Fetch Global Admins
            if (currentUser?.is_super_admin) {
                const res = await axios.get("http://127.0.0.1:8000/users/global-admins", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setUsers(res.data)
            } else {
                // CLINIC ADMIN: Fetch Local Staff
                const res = await axios.get("http://127.0.0.1:8000/users", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                // User wants to see ALL staff including themselves/other admins
                setUsers(res.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // ... (rest of filtering logic)
    const filteredUsers = users
        .filter((u) => u.username.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            // Prioritize Pure Admins (Default Admin)
            const aIsPureAdmin = a.roles.length === 1 && a.roles[0] === "admin"
            const bIsPureAdmin = b.roles.length === 1 && b.roles[0] === "admin"

            if (aIsPureAdmin && !bIsPureAdmin) return -1
            if (!aIsPureAdmin && bIsPureAdmin) return 1

            // Secondary sort: general admins
            const aIsAdmin = a.roles.includes("admin")
            const bIsAdmin = b.roles.includes("admin")
            if (aIsAdmin && !bIsAdmin) return -1
            if (!aIsAdmin && bIsAdmin) return 1

            return a.username.localeCompare(b.username)
        })

    const toggleRole = (role: string) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role))
        } else {
            setSelectedRoles([...selectedRoles, role])
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setAddError("")

        if (selectedRoles.length === 0) {
            setAddError("Please select at least one role.")
            return
        }

        try {
            const token = localStorage.getItem("token")
            await axios.post("http://127.0.0.1:8000/users", {
                username: newUsername,
                password: newPassword,
                roles: selectedRoles
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            // Reset form
            setNewUsername("")
            setNewPassword("")
            setSelectedRoles(["doctor"])
            setIsAddOpen(false)
            fetchUsers()
        } catch (err: any) {
            console.error(err)
            setAddError(err.response?.data?.detail || "Failed to create user")
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetUser) return
        try {
            const token = localStorage.getItem("token")
            await axios.post(`http://127.0.0.1:8000/users/${resetUser.id}/reset-password`, {
                password: resetPasswordInput
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            alert("Password updated successfully.")
            setResetUser(null)
            setResetPasswordInput("")
        } catch (err: any) {
            console.error(err)
            alert("Failed to reset password: " + (err.response?.data?.detail || err.message))
        }
    }

    const openEdit = (user: User) => {
        setEditingUser(user)
        setSelectedRoles(user.roles)
        setAddError("")
    }

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return
        setAddError("")

        if (selectedRoles.length === 0) {
            setAddError("Please select at least one role.")
            return
        }

        try {
            const token = localStorage.getItem("token")
            await axios.patch(`http://127.0.0.1:8000/users/${editingUser.id}`, {
                roles: selectedRoles
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setEditingUser(null)
            fetchUsers()
        } catch (err: any) {
            console.error(err)
            setAddError(err.response?.data?.detail || "Failed to update user")
        }
    }

    const toggleStatus = async (user: User) => {
        // Optimistic update
        const originalUsers = [...users]
        setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))

        try {
            const token = localStorage.getItem("token")
            // Assuming there is an endpoint or we use PATCH user
            // NOTE: The backend 'update_user' endpoint can handle is_active
            // Using PATCH /users/{id}
            await axios.patch(`http://127.0.0.1:8000/users/${user.id}`, {
                is_active: !user.is_active
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
        } catch (err) {
            console.error(err)
            setUsers(originalUsers)
            alert("Failed to update status")
        }
    }

    const handleDeleteUser = async () => {
        if (!deleteUser) return
        try {
            const token = localStorage.getItem("token")
            await axios.delete(`http://127.0.0.1:8000/users/${deleteUser.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            // Remove from local state
            setUsers(users.filter(u => u.id !== deleteUser.id))
            setDeleteUser(null)
        } catch (err: any) {
            console.error(err)
            alert("Failed to delete user: " + (err.response?.data?.detail || err.message))
        }
    }

    const RoleBadge = ({ role }: { role: string }) => {
        const colors: Record<string, string> = {
            admin: "bg-red-100 text-red-800",
            doctor: "bg-blue-100 text-blue-800",
            nurse: "bg-green-100 text-green-800",
            front_desk: "bg-purple-100 text-purple-800"
        }
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1 ${colors[role] || "bg-gray-100 text-gray-800"}`}>
                {role.replace('_', ' ')}
            </span>
        )
    }

    return (
        <div className="space-y-6">
            {/* ... (header same) ... */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {currentUser?.is_super_admin ? "Hospital Administrators" : "Staff Management"}
                    </h2>
                    <p className="text-muted-foreground">
                        {currentUser?.is_super_admin ? "Directory of admins across all clinics." : "Manage access, roles, and account status."}
                    </p>
                </div>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the account for <strong>{deleteUser?.username}</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                                Delete Account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Edit Dialog */}
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User Roles</DialogTitle>
                            <DialogDescription>Update permissions for <strong>{editingUser?.username}</strong>.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditUser} className="space-y-4">
                            {addError && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                    {addError}
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label>Roles</Label>
                                <div className="grid grid-cols-2 gap-2 border p-3 rounded-md">
                                    {AVAILABLE_ROLES.map(role => (
                                        <div key={role} className="flex items-center space-x-2">
                                            <SimpleCheckbox
                                                id={`edit-role-${role}`}
                                                checked={selectedRoles.includes(role)}
                                                onCheckedChange={() => toggleRole(role)}
                                            />
                                            <label htmlFor={`edit-role-${role}`} className="text-sm font-medium capitalize cursor-pointer">
                                                {role.replace('_', ' ')}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* ... (Add Staff Dialog same) ... */}
                {!currentUser?.is_super_admin && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Team Member</DialogTitle>
                                <DialogDescription>Create a new account for a doctor, nurse, or staff member.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                {addError && (
                                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                        {addError}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label>Username</Label>
                                    <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Password</Label>
                                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Roles</Label>
                                    <div className="grid grid-cols-2 gap-2 border p-3 rounded-md">
                                        {AVAILABLE_ROLES.map(role => (
                                            <div key={role} className="flex items-center space-x-2">
                                                <SimpleCheckbox
                                                    id={`role-${role}`}
                                                    checked={selectedRoles.includes(role)}
                                                    onCheckedChange={() => toggleRole(role)}
                                                />
                                                <label htmlFor={`role-${role}`} className="text-sm font-medium capitalize cursor-pointer">
                                                    {role.replace('_', ' ')}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Create User</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Reset Password Dialog (Available to both, but usually Super Admin might reset Clinic Admin passwords) */}
                <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>Set a new password for {resetUser?.username}.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>New Password</Label>
                                <Input
                                    type="text"
                                    value={resetPasswordInput}
                                    onChange={e => setResetPasswordInput(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Update Password</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>


            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={currentUser?.is_super_admin ? "Search clinics or admins..." : "Search staff..."}
                            className="pl-8 max-w-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                {currentUser?.is_super_admin && <TableHead>Clinic Name</TableHead>}
                                <TableHead>Username</TableHead>
                                {!currentUser?.is_super_admin && <TableHead>Roles</TableHead>}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No users found.</TableCell></TableRow>
                            ) : (
                                filteredUsers.map((user) => {
                                    const isSelf = user.id === currentUser.id
                                    const isAdmin = user.roles.includes("admin")
                                    // Protect logic:
                                    // 1. Always protect Self (User cannot delete/suspend themselves)
                                    // 2. Protect "Pure Admins" (Admins with ONLY 'admin' role) to prevent accidental lockout/modification by other admins?
                                    //    User Request: "i only want a protected for the admin who is only admin"
                                    const isPureAdmin = user.roles.length === 1 && user.roles[0] === "admin"
                                    const isProtected = (isSelf || isPureAdmin) && !currentUser.is_super_admin

                                    return (
                                        <TableRow key={user.id} className={!user.is_active ? "opacity-50 bg-muted/50" : ""}>
                                            <TableCell>
                                                <Badge variant={user.is_active ? "success" : "secondary"} className={user.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                                    {user.is_active ? "Active" : "Suspended"}
                                                </Badge>
                                            </TableCell>

                                            {/* SUPER ADMIN: Show Clinic Name */}
                                            {currentUser?.is_super_admin && (
                                                <TableCell className="font-medium text-blue-600">
                                                    {(user as any).clinic_name || "N/A"}
                                                </TableCell>
                                            )}

                                            <TableCell className="font-medium">{user.username}</TableCell>

                                            {/* CLINIC ADMIN: Show Roles */}
                                            {!currentUser?.is_super_admin && (
                                                <TableCell>
                                                    {user.roles.map(r => <RoleBadge key={r} role={r} />)}
                                                </TableCell>
                                            )}

                                            <TableCell className="text-right flex justify-end gap-2">
                                                {!isProtected && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEdit(user)}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {!isProtected && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Reset Password"
                                                            onClick={() => setResetUser(user)}
                                                        >
                                                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title={user.is_active ? "Suspend Account" : "Activate Account"}
                                                            onClick={() => toggleStatus(user)}
                                                        >
                                                            {user.is_active ? (
                                                                <Ban className="h-4 w-4 text-red-500" />
                                                            ) : (
                                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            )}
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Delete Account"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => setDeleteUser(user)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {isProtected && !currentUser.is_super_admin && (
                                                    <span className="text-xs text-muted-foreground italic px-2 py-2">Protected</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    )
}
