"use client"

import type { DeviceType } from "@/types/device-types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeviceControls } from "@/components/devices/device-controls"
import { DeviceInfo } from "@/components/devices/device-info"
import { DeviceHistory } from "@/components/devices/device-history"

interface DeviceDetailsDialogProps {
  device: DeviceType
  open: boolean
  onClose: () => void
  onUpdateState: (newState: string) => Promise<void>
  ipAddress: string
}

export function DeviceDetailsDialog({ device, open, onClose, onUpdateState, ipAddress }: DeviceDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{device.id}</DialogTitle>
          <DialogDescription>
            {device.type} device on pins {device.pins.join(", ")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="controls" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="info">Device Info</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="p-4">
            <DeviceControls device={device} onUpdateState={onUpdateState} isUpdating={false} ipAddress={ipAddress} />
          </TabsContent>

          <TabsContent value="info" className="p-4">
            <DeviceInfo device={device} />
          </TabsContent>

          <TabsContent value="history" className="p-4">
            <DeviceHistory device={device} ipAddress={ipAddress} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

