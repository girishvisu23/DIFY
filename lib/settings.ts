export type FitnessGoal = "weight-loss" | "muscle-gain" | "maintenance"
export type DietaryPreference = "balanced" | "vegan" | "keto" | "gluten-free" | "paleo"
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very-active"

export type SettingsData = {
  bmi: number
  dailyCalorieTarget: number
  goal: FitnessGoal
  dietaryPreference: DietaryPreference
  activityLevel: ActivityLevel
}

export const SETTINGS_STORAGE_KEY = "nutritrack-settings"

export const defaultSettings: SettingsData = {
  bmi: 24.5,
  dailyCalorieTarget: 2000,
  goal: "weight-loss",
  dietaryPreference: "balanced",
  activityLevel: "moderate",
}

const macroDistribution: Record<FitnessGoal, { protein: number; carbs: number; fats: number }> = {
  "weight-loss": { protein: 0.35, carbs: 0.35, fats: 0.3 },
  "muscle-gain": { protein: 0.3, carbs: 0.45, fats: 0.25 },
  maintenance: { protein: 0.25, carbs: 0.5, fats: 0.25 },
}

export const sanitizeSettings = (value: Partial<SettingsData> | null | undefined): SettingsData => {
  if (!value || typeof value !== "object") {
    return defaultSettings
  }

  const bmi = Number((value as SettingsData).bmi)
  const dailyCalorieTarget = Number((value as SettingsData).dailyCalorieTarget)

  const goal = (value as SettingsData).goal
  const dietaryPreference = (value as SettingsData).dietaryPreference
  const activityLevel = (value as SettingsData).activityLevel

  return {
    bmi: Number.isFinite(bmi) ? bmi : defaultSettings.bmi,
    dailyCalorieTarget: Number.isFinite(dailyCalorieTarget) ? Math.max(0, dailyCalorieTarget) : defaultSettings.dailyCalorieTarget,
    goal: goal && goal in macroDistribution ? goal : defaultSettings.goal,
    dietaryPreference: dietaryPreference ?? defaultSettings.dietaryPreference,
    activityLevel: activityLevel ?? defaultSettings.activityLevel,
  }
}

export const getMacroTargets = (settings: SettingsData) => {
  const distribution = macroDistribution[settings.goal] ?? macroDistribution[defaultSettings.goal]

  const proteinCalories = settings.dailyCalorieTarget * distribution.protein
  const carbsCalories = settings.dailyCalorieTarget * distribution.carbs
  const fatsCalories = settings.dailyCalorieTarget * distribution.fats

  const toGrams = (calories: number, perGram: number) =>
    Math.round((calories / perGram) * 10) / 10 || 0

  return {
    calories: settings.dailyCalorieTarget,
    protein: toGrams(proteinCalories, 4),
    carbs: toGrams(carbsCalories, 4),
    fats: toGrams(fatsCalories, 9),
  }
}


