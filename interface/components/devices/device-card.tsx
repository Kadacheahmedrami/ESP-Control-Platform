"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DeviceType } from "@/types/device-types"
import { Maximize2, Cpu, Trash, Settings } from "lucide-react"
import { DeviceControls } from "@/components/devices/device-controls"
import { DeviceIcon } from "@/components/devices/device-icon"
import { DeviceDetailsDialog } from "@/components/devices/device-details-dialog"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeviceCardProps {
  device: DeviceType
  onUpdateState: (deviceId: string, state: string) => Promise<void>
  onUpdatePins: (deviceId: string, pins: number[]) => Promise<void>
  onDelete: (deviceId: string) => Promise<void>
  ipAddress: string
  className?: string
}

export function DeviceCard({ device, onUpdateState, onUpdatePins, onDelete, ipAddress, className }: DeviceCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleUpdateState = async (newState: string) => {
    setIsUpdating(true)
    try {
      await onUpdateState(device.id, newState)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePins = async (pins: number[]) => {
    setIsUpdating(true)
    try {
      await onUpdatePins(device.id, pins)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    setIsUpdating(true)
    try {
      await onDelete(device.id)
      setShowDeleteDialog(false)
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
    <TooltipProvider>
      <Card
        className={cn(
          "device-card border-2 h-[450px] sm:h-[500px] flex flex-col transition-all duration-300 hover:shadow-lg w-full",
          isUpdating ? "opacity-80" : "",
          device.state === "on" || device.state === "1" || device.state === "true" ? "border-green-500/50" : "",
          className,
        )}
      >
        <CardHeader className="pb-2 flex-shrink-0 px-4 pt-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex items-center justify-center">
                <DeviceIcon type={device.type} className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">{device.id}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{device.type}</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>State: {device.state}</p>
                </TooltipContent>
              </Tooltip>
              <Badge variant="outline" className="text-xs">
                {device.interfaceType}
              </Badge>
            </div>
          </div>

          {/* Pin information */}
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Cpu className="h-3 w-3 mr-1" />
            <span>Pins:</span>
            <div className="flex flex-wrap gap-1 ml-1">
              {device.pins.map((pin) => (
                <Badge key={pin} variant="secondary" className="text-xs px-1.5 py-0">
                  {pin}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4">
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

        <CardFooter className="flex justify-between items-center pt-2 mt-auto flex-shrink-0 border-t bg-muted/30 px-4 py-2">
          <div className="flex items-center space-x-2">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the device "{device.id}" from your ESP32. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setShowDetails(true)}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 flex items-center justify-center"
            onClick={() => setShowDetails(true)}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Details
          </Button>
        </CardFooter>
      </Card>

      {showDetails && (
        <DeviceDetailsDialog
          device={device}
          open={showDetails}
          onClose={() => setShowDetails(false)}
          onUpdateState={handleUpdateState}
          onUpdatePins={handleUpdatePins}
          onDelete={() => onDelete(device.id)}
          ipAddress={ipAddress}
        />
      )}
    </TooltipProvider>
  )
}

