"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { Device } from "@/lib/types"

export function useESP32(ipAddress: string) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [wsMessages, setWsMessages] = useState<string[]>([])
  const [wsInputMessage, setWsInputMessage] = useState("")
  const [wsEnabled, setWsEnabled] = useState(true)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 3

  // Function to fetch devices from the ESP32
  const fetchDevices = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://${ipAddress}/api/devices`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setDevices(data)
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Request timed out. Please check your connection.")
        } else {
          setError(err.message)
        }
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setLoading(false)
    }
  }, [ipAddress])

  // Function to add a new device
  const addDevice = useCallback(
    async (device: Omit<Device, "id"> & { pin?: number }) => {
      setError(null)

      try {
        // Generate a unique ID for the device based on type and timestamp
        const deviceWithId = {
          ...device,
          id: `${device.type}_${Date.now()}`,
        }

        const response = await fetch(`http://${ipAddress}/api/device`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deviceWithId),
          signal: AbortSignal.timeout(5000),
        })

        if (!response.ok) {
          throw new Error(`Failed to add device: ${response.status} ${response.statusText}`)
        }

        // Refresh the device list after adding a new device
        await fetchDevices()
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            setError("Request timed out. Please check your connection.")
          } else {
            setError(err.message)
          }
        } else {
          setError("An unknown error occurred")
        }
        throw err
      }
    },
    [ipAddress, fetchDevices],
  )

  // Function to update a device's state
  const updateDeviceState = useCallback(
    async (deviceId: string, state: string) => {
      setError(null)

      try {
        const response = await fetch(`http://${ipAddress}/api/device/${deviceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "text/plain",
          },
          body: state,
          signal: AbortSignal.timeout(5000),
        })

        if (!response.ok) {
          throw new Error(`Failed to update device: ${response.status} ${response.statusText}`)
        }

        // Update the local state to reflect the change
        setDevices((prevDevices) =>
          prevDevices.map((device) => (device.id === deviceId ? { ...device, state } : device)),
        )
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            setError("Request timed out. Please check your connection.")
          } else {
            setError(err.message)
          }
        } else {
          setError("An unknown error occurred")
        }
        throw err
      }
    },
    [ipAddress],
  )

  // Function to connect to the WebSocket
  const connectWebSocket = useCallback(() => {
    // If WebSocket is disabled or already connected, don't try to connect
    if (!wsEnabled || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return
    }

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      // Check if we've exceeded max reconnect attempts
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setWsMessages((prev) => [
          ...prev,
          `WebSocket connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts. WebSocket disabled.`,
        ])
        setWsEnabled(false)
        return
      }

      reconnectAttemptsRef.current += 1

      // Use port 81 for WebSocket connection
      const ws = new WebSocket(`ws://${ipAddress}:81/ws`)

      ws.onopen = () => {
        setWsConnected(true)
        setWsMessages((prev) => [...prev, "WebSocket connection established"])
        reconnectAttemptsRef.current = 0 // Reset counter on successful connection
      }

      ws.onmessage = (event) => {
        setWsMessages((prev) => [...prev, event.data])
      }

      ws.onclose = () => {
        setWsConnected(false)
        setWsMessages((prev) => [...prev, "WebSocket connection closed"])
        wsRef.current = null

        // Only attempt to reconnect if WebSocket is still enabled
        if (wsEnabled) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 5000) // Longer delay between reconnect attempts
        }
      }

      ws.onerror = (error) => {
        console.log("WebSocket error:", error)
        setWsMessages((prev) => [...prev, "WebSocket error occurred"])
        // Let the onclose handler handle reconnection
      }

      wsRef.current = ws
    } catch (err) {
      console.error("Failed to connect to WebSocket:", err)
      setWsMessages((prev) => [...prev, "Failed to connect to WebSocket"])

      // Only attempt to reconnect if WebSocket is still enabled
      if (wsEnabled) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 5000)
      }
    }
  }, [ipAddress, wsEnabled])

  const sendWebSocketMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
      return true
    }
    return false
  }, [])

  // Toggle WebSocket connection
  const toggleWebSocket = useCallback(() => {
    if (wsEnabled) {
      // Disable WebSocket
      setWsEnabled(false)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      setWsConnected(false)
      setWsMessages((prev) => [...prev, "WebSocket disabled by user"])
    } else {
      // Enable WebSocket
      setWsEnabled(true)
      reconnectAttemptsRef.current = 0
      setWsMessages((prev) => [...prev, "WebSocket enabled by user"])
      connectWebSocket()
    }
  }, [wsEnabled, connectWebSocket])

  // Initialize connection and fetch devices
  useEffect(() => {
    fetchDevices()

    // Only attempt WebSocket connection if enabled
    if (wsEnabled) {
      connectWebSocket()
    }

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [ipAddress, fetchDevices, connectWebSocket, wsEnabled])

  return {
    devices,
    loading,
    error,
    wsConnected,
    wsEnabled,
    wsMessages,
    wsInputMessage,
    setWsInputMessage,
    sendWebSocketMessage,
    toggleWebSocket,
    refreshDevices: fetchDevices,
    addDevice,
    updateDeviceState,
  }
}

