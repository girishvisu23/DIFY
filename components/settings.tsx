"use client"

"use client"

import { useEffect, useMemo, useState } from "react"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSettings } from "@/hooks/use-settings"
import { SettingsData } from "@/lib/settings"

type SettingsFormState = {
  bmi: string
  dailyCalorieTarget: string
  goal: SettingsData["goal"]
  dietaryPreference: SettingsData["dietaryPreference"]
  activityLevel: SettingsData["activityLevel"]
}

const toFormState = (settings: SettingsData): SettingsFormState => ({
  bmi: settings.bmi.toString(),
  dailyCalorieTarget: settings.dailyCalorieTarget.toString(),
  goal: settings.goal,
  dietaryPreference: settings.dietaryPreference,
  activityLevel: settings.activityLevel,
})

const toSettingsData = (state: SettingsFormState, fallback: SettingsData): SettingsData => {
  const bmi = parseFloat(state.bmi)
  const dailyCalorieTarget = parseInt(state.dailyCalorieTarget, 10)

  return {
    bmi: Number.isFinite(bmi) ? bmi : fallback.bmi,
    dailyCalorieTarget: Number.isFinite(dailyCalorieTarget) ? Math.max(0, dailyCalorieTarget) : fallback.dailyCalorieTarget,
    goal: state.goal,
    dietaryPreference: state.dietaryPreference,
    activityLevel: state.activityLevel,
  }
}

export function Settings() {
  const { settings, updateSettings, hasHydrated } = useSettings()
  const [formState, setFormState] = useState<SettingsFormState>(() => toFormState(settings))
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle")

  useEffect(() => {
    if (!hasHydrated) return
    setFormState(toFormState(settings))
  }, [settings, hasHydrated])

  const handleChange = (key: keyof SettingsFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
    setStatus("idle")
  }

  const isDirty = useMemo(() => {
    return (
      formState.bmi !== settings.bmi.toString() ||
      formState.dailyCalorieTarget !== settings.dailyCalorieTarget.toString() ||
      formState.goal !== settings.goal ||
      formState.dietaryPreference !== settings.dietaryPreference ||
      formState.activityLevel !== settings.activityLevel
    )
  }, [formState, settings])

  const handleSave = () => {
    if (!hasHydrated) return
    setStatus("saving")
    const next = toSettingsData(formState, settings)
    updateSettings(next)
    setStatus("saved")
    setTimeout(() => {
      setStatus("idle")
    }, 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your nutrition profile and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="bg-card border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Current BMI</label>
                <input
                  type="text"
                  value={formState.bmi}
                  onChange={(e) => handleChange("bmi", e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Daily Calorie Target</label>
                <input
                  type="text"
                  value={formState.dailyCalorieTarget}
                  onChange={(e) => handleChange("dailyCalorieTarget", e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </Card>

          {/* Goals & Preferences */}
          <Card className="bg-card border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Goals & Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Fitness Goal</label>
                <select
                  value={formState.goal}
                  onChange={(e) => handleChange("goal", e.target.value as SettingsFormState["goal"])}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="weight-loss">Weight Loss</option>
                  <option value="muscle-gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Dietary Preference</label>
                <select
                  value={formState.dietaryPreference}
                  onChange={(e) =>
                    handleChange(
                      "dietaryPreference",
                      e.target.value as SettingsFormState["dietaryPreference"],
                    )
                  }
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="balanced">Balanced</option>
                  <option value="vegan">Vegan</option>
                  <option value="keto">Keto</option>
                  <option value="gluten-free">Gluten-Free</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Activity Level</label>
                <select
                  value={formState.activityLevel}
                  onChange={(e) =>
                    handleChange("activityLevel", e.target.value as SettingsFormState["activityLevel"])
                  }
                  className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                  <option value="very-active">Very Active</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              disabled={!hasHydrated || !isDirty || status === "saving"}
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={18} className="mr-2" />
              {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
