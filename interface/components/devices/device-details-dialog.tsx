"use client"

import type { DeviceType } from "@/types/device-types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeviceControls } from "@/components/devices/device-controls"
import { DeviceInfo } from "@/components/devices/device-info"
import { DeviceHistory } from "@/components/devices/device-history"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useState } from "react"
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
import { DevicePinsEditor } from "@/components/devices/device-pins-editor"

interface DeviceDetailsDialogProps {
  device: DeviceType
  open: boolean
  onClose: () => void
  onUpdateState: (newState: string) => Promise<void>
  onUpdatePins: (pins: number[]) => Promise<void>
  onDelete: () => Promise<void>
  ipAddress: string
}

export function DeviceDetailsDialog({
  device,
  open,
  onClose,
  onUpdateState,
  onUpdatePins,
  onDelete,
  ipAddress,
}: DeviceDetailsDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await onDelete()
      onClose() // Close the details dialog after successful deletion
    } catch (error) {
      console.error("Error deleting device:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{device.id}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {device.type} device on pins {device.pins.join(", ")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="controls" className="mt-2 sm:mt-4 flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="info">Device Info</TabsTrigger>
            <TabsTrigger value="pins">Pins</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="controls" className="p-2 sm:p-4 h-full">
              <DeviceControls device={device} onUpdateState={onUpdateState} isUpdating={false} ipAddress={ipAddress} />
            </TabsContent>

            <TabsContent value="info" className="p-2 sm:p-4 h-full">
              <DeviceInfo device={device} />
            </TabsContent>

            <TabsContent value="pins" className="p-2 sm:p-4 h-full">
              <DevicePinsEditor device={device} onUpdatePins={onUpdatePins} />
            </TabsContent>

            <TabsContent value="history" className="p-2 sm:p-4 h-full">
              <DeviceHistory device={device} ipAddress={ipAddress} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 border-t pt-4 flex justify-between items-center">
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center">
                <Trash className="h-4 w-4 mr-2" />
                Delete Device
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

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

