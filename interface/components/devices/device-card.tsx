"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DeviceType } from "@/types/device-types"
import { Settings, Maximize2 } from "lucide-react"
import { DeviceControls } from "@/components/devices/device-controls"
import { DeviceIcon } from "@/components/devices/device-icon"
import { DeviceDetailsDialog } from "@/components/devices/device-details-dialog"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DeviceCardProps {
  device: DeviceType
  onUpdateState: (deviceId: string, state: string) => Promise<void>
  ipAddress: string
}

export function DeviceCard({ device, onUpdateState, ipAddress }: DeviceCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleUpdateState = async (newState: string) => {
    setIsUpdating(true)
    try {
      await onUpdateState(device.id, newState)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = () => {
    // Determine status color based on device state
    if (device.state === "error") return "bg-destructive"
    if (device.state === "on" || device.state === "1" || device.state === "true") return "bg-green-500"
    if (device.state === "off" || device.state === "0" || device.state === "false") return "bg-gray-400"
    return "bg-amber-500" // Unknown or other state
  }

  return (
    <>
      <Card className={cn("device-card border-2 h-[500px] flex flex-col", isUpdating ? "opacity-80" : "")}>
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-full bg-primary/10">
                <DeviceIcon type={device.type} className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{device.id}</CardTitle>
                <CardDescription>{device.type}</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
              <Badge variant="outline">{device.interfaceType}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6">
            <div className="py-2">
              <DeviceControls
                device={device}
                onUpdateState={handleUpdateState}
                isUpdating={isUpdating}
                ipAddress={ipAddress}
              />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between pt-2 mt-auto flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowDetails(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Details
          </Button>
        </CardFooter>
      </Card>

      <DeviceDetailsDialog
        device={device}
        open={showDetails}
        onClose={() => setShowDetails(false)}
        onUpdateState={handleUpdateState}
        ipAddress={ipAddress}
      />
    </>
  )
}

