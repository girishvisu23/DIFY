"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { Dashboard } from "@/components/dashboard"
import { MealPlanner } from "@/components/meal-planner"
import { CalorieTracker } from "@/components/calorie-tracker"
import { Settings } from "@/components/settings"

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat")

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return <ChatInterface />
      case "calorie-tracker":
        return <CalorieTracker />
      case "meal-planner":
        return <MealPlanner />
      case "dashboard":
        return <Dashboard />
      case "settings":
        return <Settings />
      default:
        return <ChatInterface />
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">{renderContent()}</div>
    </div>
  )
}
