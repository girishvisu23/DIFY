export type Meal = {
  type: string
  meal: string
  calories: number
  protein: string
  carbs?: string
  fats?: string
}

export type MealPlan = Record<string, Meal[]>

export const MEAL_PLAN_STORAGE_KEY = "nutritrack-meal-plan"

export const defaultMealPlan: MealPlan = {
  Monday: [
    { type: "Breakfast", meal: "Oatmeal with berries", calories: 350, protein: "8g", carbs: "60g", fats: "7g" },
    { type: "Lunch", meal: "Grilled chicken salad", calories: 450, protein: "35g", carbs: "20g", fats: "18g" },
    { type: "Dinner", meal: "Salmon with vegetables", calories: 550, protein: "40g", carbs: "25g", fats: "26g" },
    { type: "Snack", meal: "Greek yogurt", calories: 150, protein: "20g", carbs: "9g", fats: "3g" },
  ],
  Tuesday: [
    { type: "Breakfast", meal: "Eggs & toast", calories: 380, protein: "15g", carbs: "32g", fats: "18g" },
    { type: "Lunch", meal: "Turkey sandwich", calories: 420, protein: "30g", carbs: "40g", fats: "12g" },
    { type: "Dinner", meal: "Pasta primavera", calories: 580, protein: "18g", carbs: "78g", fats: "16g" },
    { type: "Snack", meal: "Almonds & fruit", calories: 200, protein: "6g", carbs: "15g", fats: "14g" },
  ],
  Wednesday: [
    { type: "Breakfast", meal: "Yogurt parfait", calories: 320, protein: "12g", carbs: "52g", fats: "7g" },
    { type: "Lunch", meal: "Quinoa bowl", calories: 480, protein: "18g", carbs: "65g", fats: "14g" },
    { type: "Dinner", meal: "Grilled steak with sweet potato", calories: 620, protein: "45g", carbs: "45g", fats: "30g" },
    { type: "Snack", meal: "Apple with peanut butter", calories: 180, protein: "7g", carbs: "22g", fats: "9g" },
  ],
  Thursday: [
    { type: "Breakfast", meal: "Smoothie bowl", calories: 360, protein: "10g", carbs: "62g", fats: "6g" },
    { type: "Lunch", meal: "Tuna salad wrap", calories: 410, protein: "28g", carbs: "34g", fats: "14g" },
    { type: "Dinner", meal: "Chicken stir-fry with rice", calories: 570, protein: "38g", carbs: "60g", fats: "18g" },
    { type: "Snack", meal: "Protein bar", calories: 190, protein: "20g", carbs: "22g", fats: "6g" },
  ],
  Friday: [
    { type: "Breakfast", meal: "Pancakes with syrup", calories: 420, protein: "9g", carbs: "68g", fats: "12g" },
    { type: "Lunch", meal: "Fish tacos", calories: 460, protein: "32g", carbs: "45g", fats: "18g" },
    { type: "Dinner", meal: "Beef and broccoli", calories: 590, protein: "42g", carbs: "35g", fats: "28g" },
    { type: "Snack", meal: "Hummus & veggies", calories: 140, protein: "5g", carbs: "12g", fats: "7g" },
  ],
  Saturday: [
    { type: "Breakfast", meal: "French toast", calories: 380, protein: "11g", carbs: "55g", fats: "12g" },
    { type: "Lunch", meal: "Mediterranean pasta", calories: 520, protein: "16g", carbs: "70g", fats: "18g" },
    { type: "Dinner", meal: "Roasted chicken with veggies", calories: 540, protein: "48g", carbs: "30g", fats: "22g" },
    { type: "Snack", meal: "Berry smoothie", calories: 160, protein: "8g", carbs: "28g", fats: "3g" },
  ],
  Sunday: [
    { type: "Breakfast", meal: "Avocado toast", calories: 340, protein: "14g", carbs: "32g", fats: "18g" },
    { type: "Lunch", meal: "Vegetable soup & bread", calories: 380, protein: "12g", carbs: "48g", fats: "10g" },
    { type: "Dinner", meal: "Shrimp and pasta", calories: 520, protein: "36g", carbs: "58g", fats: "14g" },
    { type: "Snack", meal: "Cheese & crackers", calories: 170, protein: "8g", carbs: "12g", fats: "10g" },
  ],
}

export const parseProteinValue = (protein: string) => {
  const numeric = Number(String(protein).replace(/[^\d.]/g, ""))
  return Number.isFinite(numeric) ? numeric : 0
}

export const summarizeMeals = (meals: Meal[]) =>
  meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories
      acc.protein += parseProteinValue(meal.protein)
      acc.carbs += meal.carbs ? parseProteinValue(meal.carbs) : 0
      acc.fats += meal.fats ? parseProteinValue(meal.fats) : 0
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  )

