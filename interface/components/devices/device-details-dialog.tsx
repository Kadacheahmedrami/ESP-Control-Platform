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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{device.id}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {device.type} device on pins {device.pins.join(", ")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="controls" className="mt-2 sm:mt-4 flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="info">Device Info</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="controls" className="p-2 sm:p-4 h-full">
              <DeviceControls device={device} onUpdateState={onUpdateState} isUpdating={false} ipAddress={ipAddress} />
            </TabsContent>

            <TabsContent value="info" className="p-2 sm:p-4 h-full">
              <DeviceInfo device={device} />
            </TabsContent>

            <TabsContent value="history" className="p-2 sm:p-4 h-full">
              <DeviceHistory device={device} ipAddress={ipAddress} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

