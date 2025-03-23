"use client"

import { useState, useEffect } from "react"
import type { DeviceType } from "@/types/device-types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWebSocket } from "@/hooks/use-websocket"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Gauge } from "@/components/visualizations/gauge"

interface SensorDisplayProps {
  device: DeviceType
  ipAddress: string
}

export function SensorDisplay({ device, ipAddress }: SensorDisplayProps) {
  const [sensorData, setSensorData] = useState<any[]>([])
  const [currentValue, setCurrentValue] = useState<number>(0)
  const [sensorType, setSensorType] = useState<string>("temperature")
  const { lastMessage } = useWebSocket(ipAddress)

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

  // Process WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage)

        // Check if this message is for this sensor
        if (data.deviceId === device.id && data.value !== undefined) {
          const value = Number.parseFloat(data.value)
          if (!isNaN(value)) {
            setCurrentValue(value)
            addDataPoint(value)
          }
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON messages
      }
    }
  }, [lastMessage, device.id])

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
        return { min: -10, max: 50 }
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

  const { min, max } = getMinMaxValues()
  const unit = getSensorUnit()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="capitalize">
          {sensorType} Sensor
        </Badge>
        <Badge variant="secondary">
          {currentValue}
          {unit}
        </Badge>
      </div>

      <Tabs defaultValue="gauge">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gauge">Gauge</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="gauge" className="pt-4">
          <Gauge value={currentValue} min={min} max={max} label={`${currentValue}${unit}`} type={sensorType} />
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
              <div className="flex items-center justify-center h-full text-muted-foreground">Waiting for data...</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

