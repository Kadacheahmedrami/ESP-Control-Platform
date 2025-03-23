"use client"

import { useState, useEffect } from "react"
import { DeviceGrid } from "@/components/devices/device-grid"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useDevices } from "@/hooks/use-devices"
import { useWebSocket } from "@/hooks/use-websocket"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { DeviceType } from "@/types/device-types"
import { motion } from "framer-motion"
import { AddDeviceForm } from "@/components/devices/add-device-form"

interface DashboardProps {
  ipAddress: string
  onDisconnect: () => void
}

export function Dashboard({ ipAddress, onDisconnect }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { toast } = useToast()

  const { devices, loading, error, refreshDevices, addDevice, updateDeviceState } = useDevices(ipAddress)

  const {
    connected: wsConnected,
    messages: wsMessages,
    sendMessage: wsSendMessage,
    lastMessage,
    error: wsError,
  } = useWebSocket(ipAddress)

  // Process WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        // Try to parse the message as JSON
        const data = JSON.parse(lastMessage)

        // If it contains device updates, refresh the devices
        if (data.type === "device_update") {
          refreshDevices()
          toast({
            title: "Device Updated",
            description: `${data.deviceId} state changed to ${data.state}`,
          })
        }
      } catch (e) {
        // If it's not JSON, just log it
        console.log("Received WebSocket message:", lastMessage)
      }
    }
  }, [lastMessage, refreshDevices, toast])

  // Group devices by type for filtering
  const deviceCategories = devices.reduce(
    (acc, device) => {
      const type = device.type as string
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(device)
      return acc
    },
    {} as Record<string, DeviceType[]>,
  )

  // Filter devices based on active category
  const filteredDevices = activeCategory ? deviceCategories[activeCategory] || [] : devices

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading devices...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        deviceCategories={Object.keys(deviceCategories)}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
        wsConnected={wsConnected}
        wsMessages={wsMessages}
        onSendMessage={wsSendMessage}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          ipAddress={ipAddress}
          onDisconnect={onDisconnect}
          onToggleSidebar={toggleSidebar}
          wsConnected={wsConnected}
          onRefresh={refreshDevices}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {wsError && (
            <Alert variant="warning" className="mb-6">
              <AlertTitle>WebSocket Error</AlertTitle>
              <AlertDescription>{wsError}</AlertDescription>
            </Alert>
          )}

          {devices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[80vh] text-center"
            >
              <h2 className="text-2xl font-bold mb-2">No devices found</h2>
              <p className="text-muted-foreground mb-6">
                No devices are registered on your ESP32. Add a device to get started.
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <DeviceGrid devices={filteredDevices} onUpdateDevice={updateDeviceState} ipAddress={ipAddress} />
            </motion.div>
          )}

          {/* Add Device Form */}
          <AddDeviceForm onAddDevice={addDevice} />
        </main>
      </div>
    </div>
  )
}

