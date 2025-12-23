import { useState, useEffect } from "react"
import axios from "axios"
import { Calendar, Plus, Clock, FileText, Pill, Trash2, CheckCircle2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

// Types
interface Appointment {
    id: string
    patient_id: string
    doctor_id: string
    start_time: string
    status: string
    reason: string
}

interface User { id: string; username: string; roles: string[] }
interface Patient { id: string; name: string; mrn: string }

interface Medication {
    drug: string
    dose: string
    freq: string
    duration: string
}

export default function Appointments() {
    // Data State
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [doctors, setDoctors] = useState<User[]>([])

    // Booking Form State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [bookingForm, setBookingForm] = useState({
        patient: "", doctor: "", date: "", time: "", reason: ""
    })

    // Rx Writer State
    const [activeApt, setActiveApt] = useState<Appointment | null>(null)
    const [isRxOpen, setIsRxOpen] = useState(false)
    const [medications, setMedications] = useState<Medication[]>([
        { drug: "", dose: "", freq: "", duration: "" }
    ])
    const [rxNotes, setRxNotes] = useState("")
    const [lastRxId, setLastRxId] = useState<string | null>(null)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token")
            const headers = { Authorization: `Bearer ${token}` }
            const [a, p, u] = await Promise.all([
                axios.get("http://127.0.0.1:8000/appointments", { headers }),
                axios.get("http://127.0.0.1:8000/patients", { headers }),
                axios.get("http://127.0.0.1:8000/users", { headers })
            ])
            setAppointments(a.data)
            setPatients(p.data)
            setDoctors(u.data.filter((x: User) => x.roles.includes("doctor")))
        } catch (e) { console.error(e) }
    }

    // --- Booking Logic ---
    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem("token")
            await axios.post("http://127.0.0.1:8000/appointments", {
                patient_id: bookingForm.patient,
                doctor_id: bookingForm.doctor,
                start_time: new Date(`${bookingForm.date}T${bookingForm.time}`).toISOString(),
                detail: bookingForm.reason
            }, { headers: { Authorization: `Bearer ${token}` } })
            setIsAddOpen(false)
            fetchData()
        } catch (e) { alert("Failed to schedule") }
    }

    // --- Rx Logic ---
    const openRxWriter = (apt: Appointment) => {
        setActiveApt(apt)
        setMedications([{ drug: "", dose: "", freq: "", duration: "" }])
        setRxNotes("")
        setLastRxId(null)
        setIsRxOpen(true)
    }

    const updateMed = (idx: number, field: keyof Medication, val: string) => {
        const newMeds = [...medications]
        newMeds[idx][field] = val
        setMedications(newMeds)
    }

    const addMedRow = () => setMedications([...medications, { drug: "", dose: "", freq: "", duration: "" }])
    const removeMedRow = (idx: number) => setMedications(medications.filter((_, i) => i !== idx))

    const saveRx = async () => {
        if (!activeApt) return
        try {
            const token = localStorage.getItem("token")
            const validMeds = medications.filter(m => m.drug.trim() !== "")
            if (validMeds.length === 0) { alert("Add at least one drug"); return }

            const res = await axios.post(`http://127.0.0.1:8000/appointments/${activeApt.id}/prescriptions`, {
                medications: validMeds,
                notes: rxNotes
            }, { headers: { Authorization: `Bearer ${token}` } })

            setLastRxId(res.data.id) // Capture ID for printing
            alert("Prescription Saved!")
        } catch (e: any) {
            alert("Error: " + (e.response?.data?.detail || "Failed to save"))
        }
    }

    const printRx = () => {
        if (lastRxId) {
            const token = localStorage.getItem("token")
            // We need to pass token via URL or use a blob fetch. 
            // For simplicity in this demo, we assume browser handles basic auth or we'd need a dedicated download function.
            // Since our backend expects Header, we actually CAN'T just open window.
            // We need to fetch blob.
            downloadPdf(lastRxId)
        }
    }

    const downloadPdf = async (rxId: string) => {
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get(`http://127.0.0.1:8000/prescriptions/${rxId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `prescription.pdf`)
            document.body.appendChild(link)
            link.click()
        } catch (e) {
            alert("Failed to download PDF")
        }
    }

    // --- Helpers ---
    const getPName = (id: string) => patients.find(p => p.id === id)?.name || "Unknown"
    const getDName = (id: string) => doctors.find(d => d.id === id)?.username || "Unknown"

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
                    <p className="text-muted-foreground">Clinical schedule & actions.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Visit</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Book Appointment</DialogTitle></DialogHeader>
                        <form onSubmit={handleSchedule} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Patient</Label>
                                <select className="flex h-10 rounded-md border px-3"
                                    value={bookingForm.patient} onChange={e => setBookingForm({ ...bookingForm, patient: e.target.value })} required>
                                    <option value="">Select...</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Doctor</Label>
                                <select className="flex h-10 rounded-md border px-3"
                                    value={bookingForm.doctor} onChange={e => setBookingForm({ ...bookingForm, doctor: e.target.value })} required>
                                    <option value="">Select...</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.username}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="date" required onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })} />
                                <Input type="time" required onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })} />
                            </div>
                            <Label>Reason</Label>
                            <Input onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })} />
                            <DialogFooter><Button type="submit">Book</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Rx Modal */}
            <Dialog open={isRxOpen} onOpenChange={setIsRxOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Write Prescription</DialogTitle>
                        <DialogDescription>
                            For {activeApt && getPName(activeApt.patient_id)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="border rounded-md p-2 bg-muted/20">
                            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase">
                                <div className="col-span-5">Drug Name</div>
                                <div className="col-span-2">Dose</div>
                                <div className="col-span-2">Freq</div>
                                <div className="col-span-2">Duration</div>
                                <div className="col-span-1"></div>
                            </div>
                            {medications.map((med, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                    <div className="col-span-5">
                                        <Input placeholder="Amoxicillin" value={med.drug} onChange={e => updateMed(idx, 'drug', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <Input placeholder="500mg" value={med.dose} onChange={e => updateMed(idx, 'dose', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <Input placeholder="BD" value={med.freq} onChange={e => updateMed(idx, 'freq', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <Input placeholder="5 Days" value={med.duration} onChange={e => updateMed(idx, 'duration', e.target.value)} />
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <Button variant="ghost" size="icon" onClick={() => removeMedRow(idx)} disabled={medications.length === 1}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addMedRow} className="mt-2 w-full border-dashed">
                                <Plus className="h-3 w-3 mr-1" /> Add Medication
                            </Button>
                        </div>
                        <div>
                            <Label>Clinical Notes / Advice</Label>
                            <Textarea placeholder="Drink plenty of water..." value={rxNotes} onChange={e => setRxNotes(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        {lastRxId ? (
                            <Button variant="secondary" onClick={printRx} className="gap-2">
                                <Printer className="w-4 h-4" /> Print PDF
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setIsRxOpen(false)}>Cancel</Button>
                                <Button onClick={saveRx}><Pill className="mr-2 h-4 w-4" /> Save Prescription</Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Clinical Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.map(apt => (
                                <TableRow key={apt.id}>
                                    <TableCell className="flex items-center gap-2 font-medium">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </TableCell>
                                    <TableCell>
                                        <div>{getPName(apt.patient_id)}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">Dr. {getDName(apt.doctor_id)}</div>
                                    </TableCell>
                                    <TableCell>{apt.reason || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{apt.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openRxWriter(apt)}>
                                                <FileText className="h-3 w-3 mr-1 text-blue-600" /> Rx
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
