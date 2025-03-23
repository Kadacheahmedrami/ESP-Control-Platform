"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export function useWebSocket(ipAddress: string) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  // Function to connect to the WebSocket
  const connectWebSocket = useCallback(() => {
    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      // Check if we've exceeded max reconnect attempts
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setError(`WebSocket connection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`)
        return
      }

      reconnectAttemptsRef.current += 1

      // Connect to WebSocket on port 81
      const ws = new WebSocket(`ws://${ipAddress}:81/ws`)

      ws.onopen = () => {
        setConnected(true)
        setMessages((prev) => [...prev, "WebSocket connection established"])
        setError(null)
        reconnectAttemptsRef.current = 0 // Reset counter on successful connection
      }

      ws.onmessage = (event) => {
        setMessages((prev) => [...prev, event.data])
        setLastMessage(event.data)
      }

      ws.onclose = () => {
        setConnected(false)
        setMessages((prev) => [...prev, "WebSocket connection closed"])
        wsRef.current = null

        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 3000)
      }

      ws.onerror = () => {
        setError("WebSocket error occurred")
        // Let the onclose handler handle reconnection
      }

      wsRef.current = ws
    } catch (err) {
      setError("Failed to connect to WebSocket")

      // Attempt to reconnect after a delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 3000)
    }
  }, [ipAddress])

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
      setMessages((prev) => [...prev, `Sent: ${message}`])
      return true
    }
    return false
  }, [])

  // Connect to WebSocket on initial render and when IP changes
  useEffect(() => {
    connectWebSocket()

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
  }, [connectWebSocket])

  return {
    connected,
    messages,
    lastMessage,
    error,
    sendMessage,
  }
}

