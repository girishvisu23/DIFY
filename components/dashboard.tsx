"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { Card } from "@/components/ui/card"
import { useSettings } from "@/hooks/use-settings"
import { getMacroTargets } from "@/lib/settings"
import { MEAL_PLAN_STORAGE_KEY, MealPlan, defaultMealPlan, parseProteinValue } from "@/lib/meal-plan"

export function Dashboard() {
  const [mealPlan, setMealPlan] = useState<MealPlan>(defaultMealPlan)
  const [hasHydrated, setHasHydrated] = useState(false)
  const { settings } = useSettings()
  const macroTargets = useMemo(() => getMacroTargets(settings), [settings])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const storedPlan = window.localStorage.getItem(MEAL_PLAN_STORAGE_KEY)
      if (storedPlan) {
        const parsed = JSON.parse(storedPlan) as MealPlan
        if (parsed && typeof parsed === "object") {
          setMealPlan((prev) => ({ ...prev, ...parsed }))
        }
      }
    } catch (error) {
      console.error("Failed to load meal plan for dashboard:", error)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  const weeklyTotals = useMemo(() => {
    return Object.entries(mealPlan).map(([day, meals]) => {
      const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
      const totalProtein = meals.reduce((sum, meal) => sum + parseProteinValue(meal.protein), 0)

      return {
        day,
        dayShort: day.slice(0, 3),
        calories: totalCalories,
        protein: totalProtein,
      }
    })
  }, [mealPlan])

  const averageDailyCalories = useMemo(() => {
    if (!weeklyTotals.length) return 0
    const total = weeklyTotals.reduce((sum, day) => sum + day.calories, 0)
    return Math.round(total / weeklyTotals.length)
  }, [weeklyTotals])

  const calorieData = weeklyTotals.map((entry) => ({
    day: entry.dayShort,
    target: macroTargets.calories,
    actual: entry.calories,
  }))

  const nutrientBreakdown = useMemo(() => {
    const today = weeklyTotals[0]
    if (!today) {
      return [
        { name: "Protein", value: 0, fill: "#4c9f6f" },
        { name: "Remaining Calories", value: 100, fill: "#a8d5a8" },
      ]
    }

    const proteinCalories = today.protein * 4
    const remainingCalories = Math.max(today.calories - proteinCalories, 0)
    const totalCalories = proteinCalories + remainingCalories || 1

    const proteinPercent = Math.round((proteinCalories / totalCalories) * 100)
    const remainingPercent = Math.max(100 - proteinPercent, 0)

    return [
      { name: "Protein", value: proteinPercent, fill: "#4c9f6f" },
      { name: "Other Calories", value: remainingPercent, fill: "#a8d5a8" },
    ]
  }, [weeklyTotals])

  const progressData = useMemo(
    () => [
      { week: "Week 1", weight: 180, target: 175 },
      { week: "Week 2", weight: 179, target: 175 },
      { week: "Week 3", weight: 178, target: 175 },
      { week: "Week 4", weight: 176, target: 175 },
    ],
    [],
  )

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Progress Dashboard</h1>
          <p className="text-muted-foreground">Track your nutrition and fitness progress</p>
        </div>

        {!hasHydrated && (
          <div className="mb-6 text-sm text-muted-foreground">Loading the latest nutrition data…</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Avg Daily Calories", value: averageDailyCalories.toLocaleString(), unit: "kcal" },
            {
              label: "Weekly Target",
              value: macroTargets.calories.toLocaleString(),
              unit: "kcal / day",
            },
            { label: "Logged Days", value: weeklyTotals.length.toString(), unit: "days" },
            {
              label: "Protein Today",
              value: `${Math.round(weeklyTotals[0]?.protein ?? 0)}g`,
              unit: "estimated",
            },
            {
              label: "BMI",
              value: settings.bmi.toFixed(1),
              unit: settings.goal.replace("-", " "),
            },
          ].map((stat, i) => (
            <Card key={i} className="bg-card border border-border p-6">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.unit}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calorie Trends */}
          <Card className="bg-card border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Calorie Intake</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calorieData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="target" fill="var(--color-chart-2)" name="Target" />
                <Bar dataKey="actual" fill="var(--color-chart-1)" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Nutrient Breakdown */}
          <Card className="bg-card border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Today's Nutrient Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={nutrientBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {nutrientBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

        </div>
      </div>
    </div>
  )
}
