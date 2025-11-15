import { useCallback, useEffect, useRef, useState } from "react"

import {
  SETTINGS_STORAGE_KEY,
  SettingsData,
  defaultSettings,
  sanitizeSettings,
} from "@/lib/settings"

const loadSettings = (): SettingsData => {
  if (typeof window === "undefined") {
    return defaultSettings
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      return defaultSettings
    }
    const parsed = JSON.parse(raw) as Partial<SettingsData>
    return sanitizeSettings(parsed)
  } catch (error) {
    console.error("Failed to parse stored settings:", error)
    return defaultSettings
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [hasHydrated, setHasHydrated] = useState(false)
  const isUpdatingRef = useRef(false)

  const updateStateFromStorage = useCallback(() => {
    const next = loadSettings()
    setSettings(next)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    updateStateFromStorage()
    setHasHydrated(true)
  }, [updateStateFromStorage])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SETTINGS_STORAGE_KEY && !isUpdatingRef.current) {
        updateStateFromStorage()
      }
    }

    const handleCustom = () => {
      if (!isUpdatingRef.current) {
        updateStateFromStorage()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("nutritrack-settings:update", handleCustom)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("nutritrack-settings:update", handleCustom)
    }
  }, [updateStateFromStorage])

  const updateSettings = useCallback((next: SettingsData) => {
    setSettings(next)
    if (typeof window === "undefined") return
    try {
      isUpdatingRef.current = true
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event("nutritrack-settings:update"))
    } finally {
      isUpdatingRef.current = false
    }
  }, [])

  return { settings, updateSettings, hasHydrated }
}


