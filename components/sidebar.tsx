"use client"

import { Menu, BarChart3, UtensilsCrossed, Activity, Settings } from "lucide-react"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: "chat", label: "Chat Assistant", icon: Menu },
    { id: "calorie-tracker", label: "Calorie Tracker", icon: BarChart3 },
    { id: "meal-planner", label: "Meal Planner", icon: UtensilsCrossed },
    { id: "dashboard", label: "Progress Dashboard", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <span className="text-sidebar-primary-foreground text-lg font-bold">🥗</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">NutriTrack</h1>
            <p className="text-sm text-sidebar-foreground/60">Your Nutrition Guide</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              suppressHydrationWarning
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/20"
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-6 border-t border-sidebar-border">
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-sm text-sidebar-foreground font-medium mb-2">💡 Tip</p>
          <p className="text-xs text-sidebar-foreground/70">
            Log your meals consistently for better personalized recommendations
          </p>
        </div>
      </div>
    </aside>
  )
}
