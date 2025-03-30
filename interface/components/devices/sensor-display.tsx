"use client"

import { useState, useEffect, useRef } from "react"
import type { DeviceType } from "@/types/device-types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWebSocket } from "@/hooks/use-websocket"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Gauge } from "@/components/visualizations/gauge"
import { AlertCircle, RefreshCw, Thermometer, Droplets, Waves, Sun } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { apiService } from "@/services/api-service"

interface SensorDisplayProps {
  device: DeviceType
  ipAddress: string
}

export function SensorDisplay({ device, ipAddress }: SensorDisplayProps) {
  const [sensorData, setSensorData] = useState<any[]>([])
  const [currentValue, setCurrentValue] = useState<number>(0)
  const [sensorType, setSensorType] = useState<string>("temperature")
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null)
  const { lastMessage, sendMessage, connected, wsEnabled } = useWebSocket(ipAddress)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const dataRequestInterval = useRef<NodeJS.Timeout | null>(null)
  const lastRequestTime = useRef<number>(0)
  const REQUEST_THROTTLE = 2000 // 2 seconds between requests

  // Determine sensor type from device state or id
  useEffect(() => {
    if (device.id.includes("temp")) {
      setSensorType("temperature")
    } else if (device.id.includes("humid")) {
      setSensorType("humidity")
    } else if (device.id.includes("pressure")) {
      setSensorType("pressure")
    } else if (device.id.includes("light")) {
      setSensorType("light")
    } else {
      // Default to temperature if no specific type is detected
      setSensorType("temperature")
    }

    // Initialize with current state
    try {
      const value = Number.parseFloat(device.state)
      if (!isNaN(value)) {
        setCurrentValue(value)
        addDataPoint(value)
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }, [device.id, device.state])

  useEffect(() => {
    // Only set up WebSocket requests if the device exists, is connected, and is a sensor type
    if (connected && wsEnabled && device && isSensorDevice(device)) {
      // Clear any existing interval
      if (dataRequestInterval.current) {
        clearInterval(dataRequestInterval.current)
      }

      // Function to request data and set the next timer
      const scheduleNextRequest = () => {
        // Request data
        requestSensorData()
        lastRequestTime.current = Date.now()

        // Schedule next request exactly 5 seconds later
        dataRequestInterval.current = setTimeout(scheduleNextRequest, 5000)
      }

      // Start the cycle
      scheduleNextRequest()

      return () => {
        if (dataRequestInterval.current) {
          clearTimeout(dataRequestInterval.current)
          dataRequestInterval.current = null
        }
      }
    } else if (dataRequestInterval.current) {
      // Clean up interval if conditions are no longer met
      clearTimeout(dataRequestInterval.current)
      dataRequestInterval.current = null
    }
  }, [connected, wsEnabled, device, sensorType])

  // Process WebSocket messages for real-time updates with deduplication
  const lastValueRef = useRef<string | null>(null)

  useEffect(() => {
    if (lastMessage && wsEnabled) {
      try {
        const data = JSON.parse(lastMessage)

        // Handle welcome message
        if (data.type === "info" && data.supportedSensors) {
          return
        }

        // Handle error message
        if (data.error) {
          setError(data.error)
          return
        }

        // Handle sensor data with deduplication
        if (data.deviceId === device.id && data.sensor === sensorType && data.value !== undefined) {
          // Skip if this is a duplicate value
          const valueString = String(data.value)
          if (valueString === lastValueRef.current) {
            return
          }

          // Update the last value reference
          lastValueRef.current = valueString

          const value = Number.parseFloat(data.value)
          if (!isNaN(value)) {
            setCurrentValue(value)
            addDataPoint(value)
            setLastUpdateTime(new Date().toLocaleTimeString())
            setError(null) // Clear any previous errors
          }
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON messages
      }
    }
  }, [lastMessage, device.id, sensorType, wsEnabled])

  // Fallback to polling if WebSocket is not available
  useEffect(() => {
    // Start polling if WebSocket is disabled or not connected
    if (!wsEnabled || !connected) {
      if (!isPolling && !pollingInterval.current) {
        startPolling()
      }
    } else {
      // Stop polling if WebSocket is connected
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [wsEnabled, connected, isPolling])

  const startPolling = () => {
    setIsPolling(true)
    // Immediately fetch data
    fetchSensorData()

    // Then set up interval
    pollingInterval.current = setInterval(() => {
      fetchSensorData()
    }, 5000) // Poll every 5 seconds
  }

  const stopPolling = () => {
    setIsPolling(false)
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
  }

  const fetchSensorData = async () => {
    // Don't fetch if we're already loading
    if (isLoading) return

    try {
      setIsLoading(true)
      // Use the API service to get the latest device state
      const response = await apiService.getDeviceState(ipAddress, device.id)

      if (response) {
        const value = Number.parseFloat(response)
        if (!isNaN(value)) {
          setCurrentValue(value)
          addDataPoint(value)
          setLastUpdateTime(new Date().toLocaleTimeString())
          setError(null)
        }
      }
    } catch (err) {
      setError("Failed to fetch sensor data")
      console.error("Error fetching sensor data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const requestSensorData = () => {
    if (connected && wsEnabled && device && isSensorDevice(device)) {
      // Only send if we're exactly at the 5-second interval
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime.current

      // Allow a small buffer (50ms) for timing variations
      if (timeSinceLastRequest >= 4950) {
        sendMessage({
          deviceId: device.id,
          sensor: sensorType,
        })
      }
    }
  }

  const addDataPoint = (value: number) => {
    setSensorData((prev) => {
      const newData = [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          value,
        },
      ]

      // Keep only the last 20 data points
      if (newData.length > 20) {
        return newData.slice(newData.length - 20)
      }
      return newData
    })
  }

  const getSensorUnit = () => {
    switch (sensorType) {
      case "temperature":
        return "°C"
      case "humidity":
        return "%"
      case "pressure":
        return "hPa"
      case "light":
        return "lux"
      default:
        return ""
    }
  }

  const getMinMaxValues = () => {
    switch (sensorType) {
      case "temperature":
        return { min: 0, max: 40 } // More appropriate range for temperature
      case "humidity":
        return { min: 0, max: 100 }
      case "pressure":
        return { min: 900, max: 1100 }
      case "light":
        return { min: 0, max: 1000 }
      default:
        return { min: 0, max: 100 }
    }
  }

  const getSensorIcon = () => {
    switch (sensorType) {
      case "temperature":
        return <Thermometer className="h-4 w-4 mr-2" />
      case "humidity":
        return <Droplets className="h-4 w-4 mr-2" />
      case "pressure":
        return <Waves className="h-4 w-4 mr-2" />
      case "light":
        return <Sun className="h-4 w-4 mr-2" />
      default:
        return <Thermometer className="h-4 w-4 mr-2" />
    }
  }

  const getSensorName = () => {
    switch (sensorType) {
      case "temperature":
        return "Temperature Sensor"
      case "humidity":
        return "Humidity Sensor"
      case "pressure":
        return "Pressure Sensor"
      case "light":
        return "Light Sensor"
      default:
        return "Temperature Sensor"
    }
  }

  const { min, max } = getMinMaxValues()
  const unit = getSensorUnit()

  const handleManualRefresh = () => {
    // Don't allow refresh if it's been less than 5 seconds since last request
    const now = Date.now()
    if (now - lastRequestTime.current < 5000) {
      return
    }

    lastRequestTime.current = now

    if (connected && wsEnabled) {
      requestSensorData()

      // Reset the interval timer to maintain the 5-second cycle
      if (dataRequestInterval.current) {
        clearTimeout(dataRequestInterval.current)
        dataRequestInterval.current = setTimeout(() => {
          requestSensorData()
          lastRequestTime.current = Date.now()
        }, 5000)
      }
    } else {
      fetchSensorData()
    }
  }

  const isSensorDevice = (device: DeviceType): boolean => {
    // Check if the device is a sensor type
    if (device.type === "sensor") {
      return true
    }

    // Also check the ID for sensor-related keywords as a fallback
    const sensorKeywords = ["sensor", "temp", "humid", "pressure", "light"]
    return sensorKeywords.some((keyword) => device.id.toLowerCase().includes(keyword))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="capitalize flex items-center">
          {getSensorIcon()}
          {getSensorName()}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-2 py-1">
            {currentValue.toFixed(2)}
            {unit}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleManualRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {!wsEnabled && (
        <Alert variant="warning" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">WebSocket disabled. Using polling for updates.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="gauge">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gauge">Gauge</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="gauge" className="pt-4">
          <Gauge
            value={currentValue}
            min={min}
            max={max}
            label={`${currentValue.toFixed(2)}${unit}`}
            type={sensorType}
          />
        </TabsContent>

        <TabsContent value="chart" className="pt-4">
          <div className="h-[200px] w-full">
            {sensorData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.split(":").slice(0, 2).join(":")}
                  />
                  <YAxis domain={[min, max]} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}${unit}`} />
                  <Tooltip
                    formatter={(value) => [`${value}${unit}`, sensorType]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {isLoading ? "Loading data..." : "Waiting for data..."}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-muted-foreground mt-2">
        <p>Data mode: {wsEnabled && connected ? "Real-time (WebSocket)" : "Polling (REST API)"}</p>
        <p>Last update: {lastUpdateTime || "Never"}</p>
      </div>
    </div>
  )
}

