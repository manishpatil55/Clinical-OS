import * as React from "react"
import { ChevronDown } from "lucide-react"

const SelectContext = React.createContext<{
    value: string
    onValueChange: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
} | null>(null)

export function Select({ value, onValueChange, children }: { value?: string, onValueChange?: (val: string) => void, children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const [internalDesc, setInternalDesc] = React.useState(value)

    return (
        <SelectContext.Provider value={{
            value: value || internalDesc || "",
            onValueChange: onValueChange || setInternalDesc,
            open,
            setOpen
        }}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    )
}

export function SelectTrigger({ className, children }: { className?: string, children: React.ReactNode }) {
    const context = React.useContext(SelectContext)
    return (
        <button
            type="button"
            onClick={() => context?.setOpen(!context.open)}
            className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
    const context = React.useContext(SelectContext)
    // Logic to show selected text is tricky without children traversal. 
    // For V1, simplifiction: Just show value. 
    return <span>{context?.value || placeholder}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
    const context = React.useContext(SelectContext)
    if (!context?.open) return null

    return (
        <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1">
            <div className="p-1">{children}</div>
        </div>
    )
}

export function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
    const context = React.useContext(SelectContext)
    return (
        <div
            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-zinc-100 cursor-pointer"
            onClick={() => {
                context?.onValueChange(value)
                context?.setOpen(false)
            }}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {context?.value === value && <span className="text-xs">✓</span>}
            </span>
            {children}
        </div>
    )
}
