"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export function useWebSocket(ipAddress: string) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wsEnabled, setWsEnabled] = useState(true)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  // Improve the WebSocket connection with better error handling
  const connectWebSocket = useCallback(() => {
    // Don't attempt to connect if WebSocket is disabled
    if (!wsEnabled) {
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
        setError(`WebSocket connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`)
        setWsEnabled(false) // Auto-disable WebSocket after max attempts
        setMessages((prev) => [...prev, `WebSocket disabled after ${MAX_RECONNECT_ATTEMPTS} failed attempts`])
        return
      }

      reconnectAttemptsRef.current += 1

      // Validate the address before attempting to connect
      if (!ipAddress) {
        setError("Cannot connect to WebSocket: No address provided")
        return
      }

      // Add connection attempt to messages
      const wsUrl = `ws://${ipAddress}:81/ws`
      setMessages((prev) => [
        ...prev,
        `Attempting to connect to WebSocket at: ${wsUrl} (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`,
      ])

      // Connect to WebSocket on port 81
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        // Handle successful connection
        setConnected(true)
        setMessages((prev) => [...prev, "WebSocket connection established"])
        setError(null)
        reconnectAttemptsRef.current = 0 // Reset counter on successful connection
      }

      ws.onmessage = (event) => {
        // Handle incoming messages
        setMessages((prev) => [...prev, event.data])
        setLastMessage(event.data)
      }

      ws.onclose = (event) => {
        // Handle connection close
        setConnected(false)

        // Add close reason to messages
        const closeReason = event.reason ? ` Reason: ${event.reason}` : ""
        setMessages((prev) => [...prev, `WebSocket connection closed. Code: ${event.code}.${closeReason}`])

        wsRef.current = null

        // Attempt to reconnect after a delay if WebSocket is still enabled
        if (wsEnabled) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      }

      ws.onerror = () => {
        // Handle WebSocket errors - DO NOT use console.error here
        // Instead, just update the UI state
        const errorMessage = `WebSocket connection error. This might be due to:
- The ESP32 WebSocket server not running on port 81
- Network connectivity issues
- CORS restrictions
- Invalid WebSocket URL format`

        // Add error to messages instead of using console.error
        setMessages((prev) => [...prev, errorMessage])
        setError(errorMessage)

        // The onclose handler will be called after this and will handle reconnection
      }

      wsRef.current = ws
    } catch (err) {
      // Handle any errors in the WebSocket setup
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      // Add error to messages instead of using console.error
      setMessages((prev) => [...prev, `Failed to setup WebSocket: ${errorMessage}`])
      setError(`Failed to connect to WebSocket: ${errorMessage}`)

      // Attempt to reconnect after a delay if WebSocket is still enabled
      if (wsEnabled) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 3000)
      }
    }
  }, [ipAddress, wsEnabled])

  // Function to toggle WebSocket connection
  const toggleWebSocket = useCallback(() => {
    setWsEnabled((prev) => {
      const newState = !prev

      if (newState) {
        // If enabling, reset reconnect attempts and connect
        reconnectAttemptsRef.current = 0
        setMessages((prev) => [...prev, "WebSocket enabled by user"])
        // We'll connect in the useEffect that watches wsEnabled
      } else {
        // If disabling, close any existing connection
        if (wsRef.current) {
          wsRef.current.close()
          wsRef.current = null
        }

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        setConnected(false)
        setMessages((prev) => [...prev, "WebSocket disabled by user"])
      }

      return newState
    })
  }, [])

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
      setMessages((prev) => [...prev, `Sent: ${message}`])
      return true
    }
    return false
  }, [])

  // Connect to WebSocket when enabled and when IP changes
  useEffect(() => {
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
  }, [connectWebSocket, wsEnabled])

  return {
    connected,
    messages,
    lastMessage,
    error,
    wsEnabled,
    toggleWebSocket,
    sendMessage,
  }
}

