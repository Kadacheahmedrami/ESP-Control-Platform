"use client"

import type { DeviceType } from "@/types/device-types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DeviceIcon } from "@/components/devices/device-icon"

interface DeviceInfoProps {
  device: DeviceType
}

export function DeviceInfo({ device }: DeviceInfoProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Device ID</p>
              <p>{device.id}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <div className="flex items-center">
                <DeviceIcon type={device.type} className="h-4 w-4 mr-2 text-primary" />
                <span className="capitalize">{device.type}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Interface</p>
              <Badge variant="outline">{device.interfaceType}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Direction</p>
              <Badge variant="outline">{device.direction}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Pins</p>
              <div className="flex flex-wrap gap-1">
                {device.pins.map((pin) => (
                  <Badge key={pin} variant="secondary">
                    {pin}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Current State</p>
              <Badge>{device.state}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>This device was registered on the ESP32 and is controlled via the {device.interfaceType} interface.</p>
        <p className="mt-2">
          Use the Controls tab to interact with this device or view its history in the History tab.
        </p>
      </div>
    </div>
  )
}

