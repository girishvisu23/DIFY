"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettings } from "@/hooks/use-settings"
import { getMacroTargets } from "@/lib/settings"
import { MEAL_PLAN_STORAGE_KEY, Meal, defaultMealPlan, summarizeMeals } from "@/lib/meal-plan"

type MealFormState = {
  type: string
  meal: string
  calories: string
  protein: string
  carbs: string
  fats: string
}

export function MealPlanner() {
  const [selectedDay, setSelectedDay] = useState<keyof typeof defaultMealPlan>("Monday")
  const [mealPlan, setMealPlan] = useState<Record<string, Meal[]>>(defaultMealPlan)
  const [editingMeal, setEditingMeal] = useState<{ day: string; index: number } | null>(null)
  const [formState, setFormState] = useState<MealFormState | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)
  const { settings } = useSettings()

  const days = Object.keys(mealPlan)
  const today = mealPlan[selectedDay] || mealPlan.Monday
  const todayTotals = useMemo(() => summarizeMeals(today), [today])
  const macroTargets = useMemo(() => getMacroTargets(settings), [settings])
  const remainingCalories = Math.max(macroTargets.calories - todayTotals.calories, 0)

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = window.localStorage.getItem(MEAL_PLAN_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, Meal[]>
        if (parsed && typeof parsed === "object") {
          setMealPlan((prev) => ({ ...prev, ...parsed }))
        }
      }
    } catch (error) {
      console.error("Failed to load saved meal plan:", error)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return

    try {
      window.localStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(mealPlan))
    } catch (error) {
      console.error("Failed to save meal plan:", error)
    }
  }, [mealPlan, hasHydrated])

  const openEditor = (day: string, index: number) => {
    const meal = mealPlan[day]?.[index]
    if (!meal) return

    setEditingMeal({ day, index })
    setFormState({
      type: meal.type,
      meal: meal.meal,
      calories: String(meal.calories),
      protein: meal.protein,
      carbs: meal.carbs ?? "",
      fats: meal.fats ?? "",
    })
  }

  const closeEditor = () => {
    setEditingMeal(null)
    setFormState(null)
  }

  const handleInputChange =
    (field: keyof MealFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => (prev ? { ...prev, [field]: event.target.value } : prev))
    }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingMeal || !formState) return

    setMealPlan((prev) => {
      const currentMeals = prev[editingMeal.day] ?? []
      const existingMeal = currentMeals[editingMeal.index]
      if (!existingMeal) return prev

      const updatedMeals = [...currentMeals]
      const parsedCalories = Number(formState.calories)

      updatedMeals[editingMeal.index] = {
        ...existingMeal,
        type: formState.type.trim() || existingMeal.type,
        meal: formState.meal.trim() || existingMeal.meal,
        calories: Number.isNaN(parsedCalories) ? existingMeal.calories : parsedCalories,
        protein: formState.protein.trim() || existingMeal.protein,
        carbs: formState.carbs.trim() || existingMeal.carbs,
        fats: formState.fats.trim() || existingMeal.fats,
      }

      return {
        ...prev,
        [editingMeal.day]: updatedMeals,
      }
    })

    closeEditor()
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Meal Planner</h1>
            <p className="text-muted-foreground">Your personalized weekly meal plan</p>
          </div>

          {/* Day Selector */}
          <div className="mb-8 flex gap-2 overflow-x-auto pb-4">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day as keyof typeof defaultMealPlan)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedDay === day
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground hover:bg-secondary"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Daily Meals */}
          <div className="space-y-4 mb-8">
            {today.map((meal, idx) => (
              <Card key={idx} className="bg-card border border-border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-sm font-semibold text-accent">{meal.type}</span>
                    <h3 className="text-xl font-bold text-foreground mt-1">{meal.meal}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary"
                    onClick={() => openEditor(selectedDay, idx)}
                  >
                    <Plus size={18} /> Edit
                  </Button>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Calories</span>
                    <p className="font-semibold text-foreground">{meal.calories} kcal</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Protein</span>
                    <p className="font-semibold text-foreground">{meal.protein}</p>
                  </div>
                  {meal.carbs && (
                    <div>
                      <span className="text-muted-foreground">Carbs</span>
                      <p className="font-semibold text-foreground">{meal.carbs}</p>
                    </div>
                  )}
                  {meal.fats && (
                    <div>
                      <span className="text-muted-foreground">Fats</span>
                      <p className="font-semibold text-foreground">{meal.fats}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Daily Summary */}
          <Card className="bg-card border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Total Calories",
                  value: `${todayTotals.calories} kcal`,
                  target: `${macroTargets.calories} kcal`,
                },
                {
                  label: "Total Protein",
                  value: `${Math.round(todayTotals.protein)}g`,
                  target: `${macroTargets.protein}g`,
                },
                {
                  label: "Total Carbs",
                  value: `${Math.round(todayTotals.carbs)}g`,
                  target: `${macroTargets.carbs}g`,
                },
                {
                  label: "Remaining Calories",
                  value: `${Math.max(remainingCalories, 0)} kcal`,
                  color: "text-primary",
                },
                {
                  label: "Total Fats",
                  value: `${Math.round(todayTotals.fats)}g`,
                  target: `${macroTargets.fats}g`,
                },
              ].map((summary, i) => (
                <div key={i}>
                  <p className="text-sm text-muted-foreground">{summary.label}</p>
                  <p className={`text-2xl font-bold ${summary.color || "text-foreground"}`}>{summary.value}</p>
                  {summary.target && (
                    <p className="text-xs text-muted-foreground mt-1">Target: {summary.target}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(editingMeal)} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit meal entry</DialogTitle>
            <DialogDescription>Update the details for this meal.</DialogDescription>
          </DialogHeader>

          {formState && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="meal-type">Meal type</Label>
                <Input
                  id="meal-type"
                  value={formState.type}
                  onChange={handleInputChange("type")}
                  placeholder="Breakfast"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-name">Meal name</Label>
                <Input
                  id="meal-name"
                  value={formState.meal}
                  onChange={handleInputChange("meal")}
                  placeholder="Oatmeal with berries"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-calories">Calories</Label>
                <Input
                  id="meal-calories"
                  value={formState.calories}
                  onChange={handleInputChange("calories")}
                  type="number"
                  inputMode="numeric"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-protein">Protein</Label>
                <Input
                  id="meal-protein"
                  value={formState.protein}
                  onChange={handleInputChange("protein")}
                  placeholder="20g"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-carbs">Carbs</Label>
                <Input
                  id="meal-carbs"
                  value={formState.carbs}
                  onChange={handleInputChange("carbs")}
                  placeholder="45g"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-fats">Fats</Label>
                <Input
                  id="meal-fats"
                  value={formState.fats}
                  onChange={handleInputChange("fats")}
                  placeholder="15g"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditor}>
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
