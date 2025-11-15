"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettings } from "@/hooks/use-settings"
import { getMacroTargets } from "@/lib/settings"

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  servings: number
}

type FoodFormState = {
  name: string
  calories: string
  protein: string
  carbs: string
  fats: string
  servings: string
}

const FOODS_STORAGE_KEY = "nutritrack-foods"

const emptyFormState: FoodFormState = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  servings: "1",
}

export function CalorieTracker() {
  const [foods, setFoods] = useState<FoodItem[]>([
    { id: "1", name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fats: 3.6, servings: 1 },
    { id: "2", name: "Brown Rice (1 cup)", calories: 215, protein: 5, carbs: 45, fats: 1.8, servings: 1 },
    { id: "3", name: "Broccoli (1 cup)", calories: 55, protein: 3.7, carbs: 11, fats: 0.6, servings: 1 },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newFood, setNewFood] = useState<FoodFormState>(emptyFormState)
  const [hasHydrated, setHasHydrated] = useState(false)
  const { settings } = useSettings()
  const macroTargets = useMemo(() => getMacroTargets(settings), [settings])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const storedFoods = window.localStorage.getItem(FOODS_STORAGE_KEY)
      if (storedFoods) {
        const parsed = JSON.parse(storedFoods) as FoodItem[]
        if (Array.isArray(parsed)) {
          setFoods(parsed)
        }
      }
    } catch (error) {
      console.error("Failed to load saved foods:", error)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") return

    try {
      window.localStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(foods))
    } catch (error) {
      console.error("Failed to save foods:", error)
    }
  }, [foods, hasHydrated])

  const totals = useMemo(() => {
    return foods.reduce(
      (acc, food) => {
        const servings = food.servings || 1
        acc.calories += food.calories * servings
        acc.protein += food.protein * servings
        acc.carbs += food.carbs * servings
        acc.fats += food.fats * servings
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 },
    )
  }, [foods])

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) {
      return foods
    }
    const query = searchQuery.toLowerCase()
    return foods.filter((food) => food.name.toLowerCase().includes(query))
  }, [foods, searchQuery])

  const handleFormChange = (field: keyof FoodFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewFood((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const resetForm = () => setNewFood(emptyFormState)

  const handleAddFood = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newFood.name.trim()) {
      return
    }

    const parseNumber = (value: string, fallback: number) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    const parsedServings = Math.max(parseNumber(newFood.servings, 1), 0) || 1

    const foodItem: FoodItem = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(),
      name: newFood.name.trim(),
      calories: parseNumber(newFood.calories, 0),
      protein: parseNumber(newFood.protein, 0),
      carbs: parseNumber(newFood.carbs, 0),
      fats: parseNumber(newFood.fats, 0),
      servings: parsedServings,
    }

    setFoods((prev) => [...prev, foodItem])
    setIsAddOpen(false)
    resetForm()
  }

  const removeFoodItem = (id: string) => {
    setFoods((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Calorie Tracker</h1>
          <p className="text-muted-foreground">Log and track your daily nutrition intake</p>
        </div>

        {/* Search & Add */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search foods..."
              className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => (setIsAddOpen(open), open || resetForm())}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus size={18} className="mr-2" />
                Add Food
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add food item</DialogTitle>
                <DialogDescription>Enter the nutritional values for this food.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleAddFood}>
                <div className="space-y-2">
                  <Label htmlFor="food-name">Food name</Label>
                  <Input
                    id="food-name"
                    value={newFood.name}
                    onChange={handleFormChange("name")}
                    placeholder="Greek yogurt (1 cup)"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="food-calories">Calories</Label>
                    <Input
                      id="food-calories"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={newFood.calories}
                      onChange={handleFormChange("calories")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="food-servings">Servings</Label>
                    <Input
                      id="food-servings"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step="0.1"
                      value={newFood.servings}
                      onChange={handleFormChange("servings")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="food-protein">Protein (g)</Label>
                    <Input
                      id="food-protein"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.1"
                      value={newFood.protein}
                      onChange={handleFormChange("protein")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="food-carbs">Carbs (g)</Label>
                    <Input
                      id="food-carbs"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.1"
                      value={newFood.carbs}
                      onChange={handleFormChange("carbs")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="food-fats">Fats (g)</Label>
                    <Input
                      id="food-fats"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.1"
                      value={newFood.fats}
                      onChange={handleFormChange("fats")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add food</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Daily Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Calories",
              value: Math.round(totals.calories),
              unit: "kcal",
              target: `${macroTargets.calories} kcal`,
              progress: totals.calories / (macroTargets.calories || 1),
            },
            {
              label: "Protein",
              value: Math.round(totals.protein * 10) / 10,
              unit: "g",
              target: `${macroTargets.protein} g`,
              progress: totals.protein / (macroTargets.protein || 1),
            },
            {
              label: "Carbs",
              value: Math.round(totals.carbs * 10) / 10,
              unit: "g",
              target: `${macroTargets.carbs} g`,
              progress: totals.carbs / (macroTargets.carbs || 1),
            },
            {
              label: "Fats",
              value: Math.round(totals.fats * 10) / 10,
              unit: "g",
              target: `${macroTargets.fats} g`,
              progress: totals.fats / (macroTargets.fats || 1),
            },
          ].map((stat, i) => (
            <Card key={i} className="bg-card border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{stat.unit}</span>
                <span className="text-xs text-muted-foreground">Target: {stat.target}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1 mt-2">
                <div
                  className="bg-accent h-1 rounded-full transition-all"
                  style={{
                    width: `${Math.min(stat.progress * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </Card>
          ))}
        </div>

        {/* Food Items */}
        <Card className="bg-card border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Food Item</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Calories</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Protein (g)</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Carbs (g)</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Fats (g)</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.map((food) => (
                  <tr key={food.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-medium">{food.name}</td>
                    <td className="px-6 py-4 text-sm text-right text-foreground font-semibold">
                      {food.calories * food.servings}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-foreground">
                      {(food.protein * food.servings).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-foreground">
                      {(food.carbs * food.servings).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-foreground">
                      {(food.fats * food.servings).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => removeFoodItem(food.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFoods.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No foods match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
