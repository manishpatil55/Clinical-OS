import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Plus, Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Patient {
    id: string
    mrn: string
    name: string
    dob: string
    mobile: string
    gender: string
    blood_group: string
    allergies: string[]
    address: string
}

export default function Patients() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)

    // Server-Side Search & Pagination
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(0)
    const pageSize = 10

    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: "", mobile: "", dob: "", gender: "Male",
        blood_group: "", allergies: "", address: ""
    })

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPatients()
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [searchTerm, page])

    const fetchPatients = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            const skip = page * pageSize
            const res = await axios.get("http://127.0.0.1:8000/patients", {
                params: { skip, limit: pageSize, q: searchTerm || undefined },
                headers: { Authorization: `Bearer ${token}` }
            })
            setPatients(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const openForCreate = () => {
        setEditingId(null)
        setFormData({ name: "", mobile: "", dob: "", gender: "Male", blood_group: "", allergies: "", address: "" })
        setIsDialogOpen(true)
    }

    const openForEdit = (p: Patient) => {
        setEditingId(p.id)
        setFormData({
            name: p.name,
            mobile: p.mobile,
            dob: p.dob, // Assumes YYYY-MM-DD from API
            gender: p.gender,
            blood_group: p.blood_group || "",
            allergies: p.allergies?.join(", ") || "",
            address: p.address || ""
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem("token")
            const allergiesList = formData.allergies ? formData.allergies.split(",").map(s => s.trim()) : []
            const payload = { ...formData, allergies: allergiesList }

            if (editingId) {
                // Edit Mode
                await axios.patch(`http://127.0.0.1:8000/patients/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            } else {
                // Create Mode
                await axios.post("http://127.0.0.1:8000/patients", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            }

            setIsDialogOpen(false)
            fetchPatients()
        } catch (err) {
            alert("Operation failed")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Patient Registry</h2>
                    <p className="text-muted-foreground">Manage patient records and demographics.</p>
                </div>

                <Button onClick={openForCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Register Patient
                </Button>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Patient Details" : "New Patient Registration"}</DialogTitle>
                            <DialogDescription>
                                {editingId ? "Update patient information." : "Enter patient demographics. MRN will be auto-generated."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Full Name</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Mobile Number</Label>
                                <Input value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Gender</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Blood Group</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={formData.blood_group}
                                    onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                                >
                                    <option value="">Unknown / Not Set</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="Unknown">Unknown</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Known Allergies (Comma separated)</Label>
                                <Input placeholder="Peanuts, Penicillin" value={formData.allergies} onChange={e => setFormData({ ...formData, allergies: e.target.value })} />
                            </div>
                            <div className="col-span-2 grid gap-2">
                                <Label>Home Address</Label>
                                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div className="col-span-2 flex justify-end gap-2 mt-4">
                                <Button type="submit">{editingId ? "Save Changes" : "Complete Registration"}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or MRN..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value)
                                    setPage(0)
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium w-16 text-center">
                                Page {page + 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={patients.length < pageSize}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>MRN</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>DOB</TableHead>
                                <TableHead>Blood</TableHead>
                                <TableHead>Allergies</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading records...</TableCell></TableRow>
                            ) : patients.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No patients found.</TableCell></TableRow>
                            ) : (
                                patients.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono text-xs">{p.mrn}</TableCell>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell>{p.dob}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                                {p.blood_group || "?"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {p.allergies?.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {p.allergies.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                                                </div>
                                            ) : <span className="text-muted-foreground text-xs">None Known</span>}
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openForEdit(p)} title="Edit Details">
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <Link to={`/patients/${p.id}`}>
                                                <Button variant="ghost" size="sm">View Profile</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
