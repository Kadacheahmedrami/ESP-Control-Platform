"use client"

import { useState, useEffect, useRef, useCallback } from "react"

export function useWebSocket(ipAddress: string) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wsEnabled, setWsEnabled] = useState(true)
  const [sensorData, setSensorData] = useState<Record<string, string>>({})

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const messageQueueRef = useRef<Array<string | object>>([])
  const processingQueueRef = useRef(false)
  const sensorIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const MAX_RECONNECT_ATTEMPTS = 5
  const MESSAGE_THROTTLE = 100 // ms between messages
  const SENSOR_REQUEST_INTERVAL = 5000 // 5 seconds between sensor requests

  // Add this at the top of the hook with the other refs
  const lastRequestTime = useRef<number>(0)
  const lastMessageTimeRef = useRef<Record<string, number>>({})
  const MESSAGE_DEDUP_WINDOW = 1000 // 1 second window to deduplicate messages

  // Improve the message queue system to prevent duplicate messages
  const processMessageQueue = useCallback(() => {
    if (processingQueueRef.current || messageQueueRef.current.length === 0) {
      return
    }

    processingQueueRef.current = true

    const processNextMessage = () => {
      if (messageQueueRef.current.length === 0) {
        processingQueueRef.current = false
        return
      }

      const message = messageQueueRef.current.shift()
      if (message && wsRef.current?.readyState === WebSocket.OPEN) {
        const messageString = typeof message === "object" ? JSON.stringify(message) : message
        wsRef.current.send(messageString)
        setMessages((prev) => [...prev, `Sent: ${messageString}`])
      }

      setTimeout(processNextMessage, MESSAGE_THROTTLE)
    }

    processNextMessage()
  }, [])

  // Parse and handle incoming JSON messages with deduplication
  const handleMessage = useCallback((data: string) => {
    try {
      const parsedData = JSON.parse(data)

      // Handle info messages
      if (parsedData.type === "info") {
        setMessages((prev) => [...prev, `Info: ${parsedData.message}`])
        return
      }

      // Handle sensor data with deduplication
      if (parsedData.sensor && parsedData.deviceId && parsedData.value !== undefined) {
        const messageKey = `${parsedData.deviceId}_${parsedData.sensor}_${parsedData.value}`
        const now = Date.now()
        const lastTime = lastMessageTimeRef.current[messageKey] || 0

        // Only process if this exact message hasn't been seen recently
        if (now - lastTime > MESSAGE_DEDUP_WINDOW) {
          // Update last seen time for this exact message
          lastMessageTimeRef.current[messageKey] = now

          // Update the sensor data state with the latest value
          setSensorData((prev) => ({
            ...prev,
            [`${parsedData.deviceId}_${parsedData.sensor}`]: parsedData.value,
          }))

          setMessages((prev) => [...prev, `${parsedData.deviceId} ${parsedData.sensor}: ${parsedData.value}`])
        }
      }
    } catch (err) {
      // Handle non-JSON messages
      setMessages((prev) => [...prev, `Raw message: ${data}`])
    }
  }, [])

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

    // Clear any existing sensor polling interval
    if (sensorIntervalRef.current) {
      clearInterval(sensorIntervalRef.current)
      sensorIntervalRef.current = null
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

      // Reset message deduplication tracking
      lastMessageTimeRef.current = {}

      // Connect to WebSocket on port 81
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        // Handle successful connection
        setConnected(true)
        setMessages((prev) => [...prev, "WebSocket connection established"])
        setError(null)
        reconnectAttemptsRef.current = 0 // Reset counter on successful connection

        // Process any queued messages
        processMessageQueue()
      }

      ws.onmessage = (event) => {
        // Handle incoming messages
        setLastMessage(event.data)
        handleMessage(event.data)
      }

      ws.onclose = (event) => {
        // Handle connection close
        setConnected(false)

        // Clear sensor polling interval
        if (sensorIntervalRef.current) {
          clearInterval(sensorIntervalRef.current)
          sensorIntervalRef.current = null
        }

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
  }, [ipAddress, wsEnabled, processMessageQueue, handleMessage])

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

        // Clear sensor polling interval
        if (sensorIntervalRef.current) {
          clearInterval(sensorIntervalRef.current)
          sensorIntervalRef.current = null
        }

        setConnected(false)
        setMessages((prev) => [...prev, "WebSocket disabled by user"])
      }

      return newState
    })
  }, [])

  // Function to request sensor data manually
  const requestSensorData = useCallback(
    (deviceId: string, sensorType: string) => {
      const now = Date.now()
      const timeSinceLastSend = now - lastRequestTime.current

      // Only allow sending if it's been at least 1 second
      if (timeSinceLastSend >= 1000) {
        lastRequestTime.current = now
        const request = {
          deviceId,
          sensor: sensorType,
        }

        messageQueueRef.current.push(request)

        if (wsRef.current?.readyState === WebSocket.OPEN && !processingQueueRef.current) {
          processMessageQueue()
          return true
        }
      }

      return false
    },
    [processMessageQueue],
  )

  // Replace the sendMessage function with this version that enforces strict throttling
  const sendMessage = useCallback(
    (message: string | object) => {
      // Convert message to string for comparison
      const messageString = typeof message === "object" ? JSON.stringify(message) : message

      // Check if this exact message is already in the queue
      const isDuplicate = messageQueueRef.current.some((queuedMsg) => {
        const queuedMsgString = typeof queuedMsg === "object" ? JSON.stringify(queuedMsg) : queuedMsg
        return queuedMsgString === messageString
      })

      // Check if we're within the throttle period for this type of message
      let shouldSend = true

      // For sensor data requests, enforce strict throttling
      if (typeof message === "object" && "sensor" in message) {
        const now = Date.now()
        const timeSinceLastSend = now - lastRequestTime.current

        // Only allow sending if it's been at least 3 seconds
        shouldSend = timeSinceLastSend >= 3000

        if (shouldSend) {
          lastRequestTime.current = now
        }
      }

      // Only add to queue if not a duplicate and should send
      if (!isDuplicate && shouldSend) {
        messageQueueRef.current.push(message)

        // If connected, process the queue
        if (wsRef.current?.readyState === WebSocket.OPEN && !processingQueueRef.current) {
          processMessageQueue()
          return true
        }
      }

      return wsRef.current?.readyState === WebSocket.OPEN
    },
    [processMessageQueue],
  )

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

      if (sensorIntervalRef.current) {
        clearInterval(sensorIntervalRef.current)
        sensorIntervalRef.current = null
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
    requestSensorData,
    sensorData, // New - provides access to the latest sensor readings
  }
}

