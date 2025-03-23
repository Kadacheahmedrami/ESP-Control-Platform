"use client"

import { useState } from "react"
import type { Device } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface DeviceListProps {
  devices: Device[]
  loading: boolean
  onUpdateState: (deviceId: string, state: string) => Promise<void>
}

export function DeviceList({ devices, loading, onUpdateState }: DeviceListProps) {
  const [updatingDevices, setUpdatingDevices] = useState<Record<string, boolean>>({})
  const [stateInputs, setStateInputs] = useState<Record<string, string>>({})

  const handleStateChange = (deviceId: string, value: string) => {
    setStateInputs((prev) => ({ ...prev, [deviceId]: value }))
  }

  const handleUpdateState = async (deviceId: string) => {
    const newState = stateInputs[deviceId]
    if (!newState) return

    setUpdatingDevices((prev) => ({ ...prev, [deviceId]: true }))

    try {
      await onUpdateState(deviceId, newState)
      // Clear input after successful update
      setStateInputs((prev) => ({ ...prev, [deviceId]: "" }))
    } finally {
      setUpdatingDevices((prev) => ({ ...prev, [deviceId]: false }))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>Loading devices from ESP32...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>No devices found on the ESP32</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">Use the form below to add a new device</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices</CardTitle>
        <CardDescription>Manage your ESP32 devices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device.id} className="border rounded-lg p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-medium">{device.id}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">Type: {device.type}</Badge>
                    <Badge variant="outline">Interface: {device.interfaceType}</Badge>
                    <Badge variant="outline">Direction: {device.direction}</Badge>
                    <Badge variant="outline">Pins: {device.pins.join(", ")}</Badge>
                    <Badge>State: {device.state}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New state"
                    value={stateInputs[device.id] || ""}
                    onChange={(e) => handleStateChange(device.id, e.target.value)}
                    className="w-32"
                  />
                  <Button
                    onClick={() => handleUpdateState(device.id)}
                    disabled={updatingDevices[device.id] || !stateInputs[device.id]}
                    size="sm"
                  >
                    {updatingDevices[device.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

