import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { Calendar, FileText, Paperclip, AlertTriangle, User, Plus, Upload, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Attachment {
    id: string
    file_name: string
    file_type: string
    uploaded_at: string
}

interface ClinicalRecord {
    id: string
    record_type: string
    data: any
    recorded_at: string
}

interface Appointment {
    id: string
    start_time: string
    status: string
    reason: string
}

interface PatientProfile {
    id: string
    name: string
    mrn: string
    dob: string
    gender: string
    blood_group: string
    allergies: string[]
    address: string
    clinical_records: ClinicalRecord[]
    appointments: Appointment[]
    attachments: Attachment[]
}

export default function PatientProfile() {
    const { id } = useParams()
    const [patient, setPatient] = useState<PatientProfile | null>(null)
    const [loading, setLoading] = useState(true)

    // Upload State
    const [uploadOpen, setUploadOpen] = useState(false)
    const [fileName, setFileName] = useState("")
    const [fileType, setFileType] = useState("pdf") // Simple select

    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        // Get current user info for permission checks
        const fetchUser = async () => {
            const token = localStorage.getItem("token")
            try {
                const res = await axios.get("http://127.0.0.1:8000/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                setCurrentUser(res.data)
            } catch (e) { } // Ignore
        }
        fetchUser()
        fetchProfile()
    }, [id])

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await axios.get(`http://127.0.0.1:8000/patients/${id}/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPatient(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async () => {
        try {
            const token = localStorage.getItem("token")
            await axios.post(`http://127.0.0.1:8000/patients/${id}/attachments`, null, {
                params: { file_name: fileName, file_type: fileType },
                headers: { Authorization: `Bearer ${token}` }
            })
            setUploadOpen(false)
            fetchProfile()
        } catch (err) {
            alert("Upload failed")
        }
    }

    if (loading) return <div className="p-8">Loading profile...</div>
    if (!patient) return <div className="p-8">Patient not found</div>

    return (
        <div>
            {/* SCREEN VIEW (Hidden on Print) */}
            <div className="space-y-6 print:hidden">
                {/* Header Card */}
                <Card className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-zinc-200">
                    <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
                        <div className="h-24 w-24 rounded-full bg-zinc-200 flex items-center justify-center border-4 border-white shadow-sm">
                            <User className="h-12 w-12 text-zinc-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-bold text-zinc-900">{patient.name}</h2>
                                <Badge variant="outline" className="font-mono">{patient.mrn}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                                <span>DOB: <strong>{patient.dob || "N/A"}</strong></span>
                                <span>Gender: <strong>{patient.gender}</strong></span>
                                <span>Blood: <span className="text-red-600 font-bold">{patient.blood_group || "?"}</span></span>
                            </div>
                            <div className="pt-2">
                                {patient.allergies?.length > 0 ? (
                                    <div className="flex gap-2 items-center">
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        {patient.allergies.map(a => <Badge key={a} variant="destructive">{a}</Badge>)}
                                    </div>
                                ) : <span className="text-zinc-400 text-sm">No known allergies</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => window.print()}><FileText className="h-4 w-4 mr-2" /> Print Report</Button>
                            <Button variant="outline" onClick={() => fetchProfile()}>Refresh</Button>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="timeline" className="w-full">
                    <TabsList>
                        <TabsTrigger value="timeline">Clinical Timeline</TabsTrigger>
                        <TabsTrigger value="attachments">Attachments ({patient.attachments?.length || 0})</TabsTrigger>
                        <TabsTrigger value="info">Demographics</TabsTrigger>
                    </TabsList>

                    {/* TIMELINE TAB - Restricted for Front Desk */}
                    {currentUser && !currentUser.roles.includes("front_desk") ? (
                        <TabsContent value="timeline" className="space-y-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Activity History</h3>
                                {/* Add Record: Only Doctor or Nurse */}
                                {currentUser.roles.some((r: string) => ["doctor", "nurse", "admin"].includes(r)) && (
                                    <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Record</Button>
                                )}
                            </div>

                            {/* Combined History */}
                            <div className="space-y-4">
                                {/* Clinical Records (Labs etc) */}
                                {patient.clinical_records?.map(rec => (
                                    <Card key={rec.id} className="border-l-4 border-l-purple-500">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold capitalize">{rec.record_type.replace(/_/g, " ")}</h4>
                                                    <div className="mt-2 text-sm text-zinc-700 font-mono bg-zinc-50 p-2 rounded">
                                                        {Object.entries(rec.data).map(([k, v]) => (
                                                            <div key={k}><span className="text-zinc-500">{k}:</span> {v as string}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-zinc-400">{new Date(rec.recorded_at).toLocaleDateString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {patient.appointments?.map(apt => (
                                    <Card key={apt.id}>
                                        <CardContent className="p-4 flex gap-4">
                                            <div className="flex flex-col items-center min-w-[60px]">
                                                <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className="font-semibold">{apt.reason || "General Visit"}</h4>
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(apt.start_time).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-zinc-600 mt-1">Status: {apt.status}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {(patient.appointments?.length === 0 && patient.clinical_records?.length === 0) && <p className="text-zinc-500 italic">No history.</p>}
                            </div>
                        </TabsContent>
                    ) : (
                        <TabsContent value="timeline" className="pt-8 text-center text-muted-foreground">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Detailed clinical history is restricted for your role.</p>
                        </TabsContent>
                    )}

                    {/* ATTACHMENTS TAB */}
                    <TabsContent value="attachments" className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Documents & Files</h3>
                            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Upload className="h-4 w-4 mr-2" /> Upload File</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Upload Document</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="grid gap-2">
                                            <Label>File Name</Label>
                                            <Input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. Lab Report 001" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Type</Label>
                                            <select className="border p-2 rounded w-full" value={fileType} onChange={e => setFileType(e.target.value)}>
                                                <option value="pdf">PDF Document</option>
                                                <option value="jpg">Image (X-Ray/Scan)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleUpload}>Save File</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {patient.attachments?.map(file => (
                                <Card key={file.id} className="hover:bg-zinc-50 cursor-pointer">
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                        <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
                                            <Paperclip className="h-6 w-6" />
                                        </div>
                                        <div className="text-sm font-medium truncate w-full">{file.file_name}</div>
                                        <div className="text-xs text-zinc-400 capitalize">{file.file_type}</div>
                                    </CardContent>
                                </Card>
                            ))}
                            {patient.attachments?.length === 0 && <p className="col-span-4 text-center text-zinc-400 py-8">No files uploaded.</p>}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* PRINT VIEW (Visible ONLY on Print) */}
            <div className="hidden print:block p-8 max-w-[210mm] mx-auto">
                <div className="text-center border-b pb-4 mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900">Patient Summary Report</h1>
                    <p className="text-zinc-500 text-sm">Generated by Clinical OS • {new Date().toLocaleDateString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-zinc-800 uppercase text-xs tracking-wider mb-2">Patient Details</h3>
                        <div className="text-sm space-y-1">
                            <div><span className="text-zinc-500 w-24 inline-block">Name:</span> <strong>{patient.name}</strong></div>
                            <div><span className="text-zinc-500 w-24 inline-block">MRN:</span> {patient.mrn}</div>
                            <div><span className="text-zinc-500 w-24 inline-block">DOB:</span> {patient.dob}</div>
                            <div><span className="text-zinc-500 w-24 inline-block">Gender:</span> {patient.gender}</div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-800 uppercase text-xs tracking-wider mb-2">Medical Profile</h3>
                        <div className="text-sm space-y-1">
                            <div><span className="text-zinc-500 w-24 inline-block">Blood:</span> {patient.blood_group || "N/A"}</div>
                            <div><span className="text-zinc-500 w-24 inline-block">Allergies:</span> {patient.allergies?.join(", ") || "None"}</div>
                            <div><span className="text-zinc-500 w-24 inline-block">Contact:</span> {patient.address}</div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-zinc-900 border-b pb-2 mb-4">Clinical History</h3>
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50">
                            <tr>
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Type</th>
                                <th className="text-left p-2">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patient.clinical_records?.map(rec => (
                                <tr key={rec.id} className="border-b">
                                    <td className="p-2 w-32">{new Date(rec.recorded_at).toLocaleDateString()}</td>
                                    <td className="p-2 w-32 capitalize">{rec.record_type.replace(/_/g, " ")}</td>
                                    <td className="p-2">
                                        {Object.entries(rec.data).map(([k, v]) => (
                                            <span key={k} className="mr-3 text-xs"><strong className="text-zinc-600">{k}:</strong> {v as string}</span>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                            {patient.appointments?.map(apt => (
                                <tr key={apt.id} className="border-b">
                                    <td className="p-2 w-32">{new Date(apt.start_time).toLocaleDateString()}</td>
                                    <td className="p-2 w-32">Visit</td>
                                    <td className="p-2">{apt.reason || "Consultation"} (Status: {apt.status})</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-center text-xs text-zinc-400 mt-12 pt-4 border-t">
                    End of Report • {patient.id}
                </div>
            </div>
        </div>
    )
}
