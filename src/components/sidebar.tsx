"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ClipboardList, LayoutDashboard, ShieldCheck } from "lucide-react"

const routes = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden border-r bg-card/60 p-3 text-sm text-muted-foreground md:block md:w-56 lg:w-64">
      <div className="mb-6 px-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
        Navigation
      </div>
      <nav className="space-y-1">
        {routes.map((route) => {
          const Icon = route.icon
          const active = pathname === route.href

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{route.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
