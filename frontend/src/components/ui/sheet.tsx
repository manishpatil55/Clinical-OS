import * as React from "react"
import { X } from "lucide-react"

const SheetContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export function Sheet({ open, onOpenChange, children }: { open?: boolean, onOpenChange?: (open: boolean) => void, children: React.ReactNode }) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    // Simplified logic
    return (
        <SheetContext.Provider value={{ open: !!open, setOpen: onOpenChange || setInternalOpen }}>
            {children}
        </SheetContext.Provider>
    )
}

export function SheetTrigger({ children }: { children: React.ReactNode }) {
    const context = React.useContext(SheetContext)
    return <div onClick={() => context?.setOpen(true)}>{children}</div>
}

export function SheetContent({ side = "left", children }: { side?: "left" | "right", children: React.ReactNode }) {
    const context = React.useContext(SheetContext)
    if (!context?.open) return null
    return (
        <div className="fixed inset-0 z-50 flex">
            <div onClick={() => context.setOpen(false)} className="fixed inset-0 bg-black/50" />
            <div className={`fixed inset-y-0 ${side === "left" ? "left-0" : "right-0"} z-50 h-full w-3/4 border-r bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-300 sm:max-w-sm`}>
                <button onClick={() => context.setOpen(false)} className="absolute right-4 top-4 opacity-70 hover:opacity-100">
                    <X className="h-4 w-4" />
                </button>
                {children}
            </div>
        </div>
    )
}
