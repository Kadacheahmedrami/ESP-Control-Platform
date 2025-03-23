"use client"

import { useCallback } from "react"

export function useLocalStorage() {
  const getItem = useCallback((key: string): string | null => {
    if (typeof window === "undefined") {
      return null
    }

    try {
      const item = window.localStorage.getItem(key)
      return item
    } catch (error) {
      console.error("Error getting item from localStorage:", error)
      return null
    }
  }, [])

  const setItem = useCallback((key: string, value: string): void => {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(key, value)
    } catch (error) {
      console.error("Error setting item in localStorage:", error)
    }
  }, [])

  const removeItem = useCallback((key: string): void => {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error("Error removing item from localStorage:", error)
    }
  }, [])

  return { getItem, setItem, removeItem }
}

