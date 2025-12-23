import * as React from "react"

// Context for Tabs
const TabsContext = React.createContext<{
    activeTab: string
    setActiveTab: (val: string) => void
} | null>(null)

export function Tabs({ defaultValue, className, children }: { defaultValue: string, className?: string, children: React.ReactNode }) {
    const [activeTab, setActiveTab] = React.useState(defaultValue)
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    )
}

export function TabsList({ className, children }: { className?: string, children: React.ReactNode }) {
    return <div className={`inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500 ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children }: { value: string, children: React.ReactNode }) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsTrigger must be used within Tabs")

    const isActive = context.activeTab === value
    return (
        <button
            onClick={() => context.setActiveTab(value)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
        ${isActive ? "bg-white text-zinc-950 shadow-sm" : "hover:text-zinc-900"}`}
        >
            {children}
        </button>
    )
}

export function TabsContent({ value, className, children }: { value: string, className?: string, children: React.ReactNode }) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsContent must be used within Tabs")

    if (context.activeTab !== value) return null
    return <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 ${className}`}>{children}</div>
}
