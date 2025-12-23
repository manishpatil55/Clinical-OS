import { useState } from "react"
import { read, utils } from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function LabImport() {
    const [previewData, setPreviewData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState({ total: 0, current: 0, success: 0, fail: 0 })
    const [completed, setCompleted] = useState(false)

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const buffer = await file.arrayBuffer()
        const wb = read(buffer)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = utils.sheet_to_json(ws)
        setPreviewData(data)
    }

    const processImport = async () => {
        setLoading(true)
        setProgress({ total: previewData.length, current: 0, success: 0, fail: 0 })
        const token = localStorage.getItem("token")

        let s = 0; let f = 0;

        for (const [index, row] of previewData.entries()) {
            try {
                // 1. Find Patient
                const searchKey = row["MRN"] || row["Name"] || row["Patient Name"]
                if (!searchKey) throw new Error("No Identity Column (MRN/Name)")

                const patRes = await fetch(`http://127.0.0.1:8000/patients?q=${searchKey}&limit=1`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const patients = await patRes.json()
                if (!patients.length) throw new Error(`Patient Not Found: ${searchKey}`)

                const patientId = patients[0].id

                // 2. Upload Record
                const record = {
                    type: "lab_result",
                    data: row,
                    date: new Date().toISOString() // TODO: Parse date from excel if exists
                }

                const res = await fetch(`http://127.0.0.1:8000/patients/${patientId}/records`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(record)
                })
                if (!res.ok) throw new Error("Upload Failed")

                s++
            } catch (err) {
                console.error(err)
                f++
            }
            setProgress(prev => ({ ...prev, current: index + 1, success: s, fail: f }))
        }
        setLoading(false)
        setCompleted(true)
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Lab Results Import 🧪</h2>
            <p className="text-muted-foreground">Upload historic Excel files to populate Patient Timelines.</p>

            <Card>
                <CardHeader>
                    <CardTitle>1. Select File</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleFile} />
                </CardContent>
            </Card>

            {previewData.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>2. Preview ({previewData.length} Rows)</CardTitle>
                        {!loading && !completed && (
                            <Button onClick={processImport}>Start Import</Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {loading && (
                            <div className="mb-4 space-y-2">
                                <div className="text-sm font-medium">Processing... {progress.current} / {progress.total}</div>
                                <div className="h-2 w-full bg-slate-100 rounded overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all duration-75" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> {progress.success} Success</span>
                                    <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14} /> {progress.fail} Failed</span>
                                </div>
                            </div>
                        )}

                        {completed && (
                            <Alert className="mb-4 bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle>Import Completed</AlertTitle>
                                <AlertDescription>Successfully imported {progress.success} records. ({progress.fail} failed).</AlertDescription>
                            </Alert>
                        )}

                        <div className="rounded-md border max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {Object.keys(previewData[0] || {}).map((header) => (
                                            <TableHead key={header}>{header}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <TableRow key={i}>
                                            {Object.values(row).map((cell: any, j) => (
                                                <TableCell key={j}>{cell?.toString()}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
