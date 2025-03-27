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
import { Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardProps {
  ipAddress: string
  onDisconnect: () => void
}

export function Dashboard({ ipAddress, onDisconnect }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { toast } = useToast()

  const { devices, loading, error, refreshDevices, addDevice, updateDeviceState } = useDevices(ipAddress)

  const {
    connected: wsConnected,
    messages: wsMessages,
    sendMessage: wsSendMessage,
    lastMessage,
    error: wsError,
    wsEnabled,
    toggleWebSocket,
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
    if (window.innerWidth >= 768) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setMobileSidebarOpen(!mobileSidebarOpen)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-xl font-medium">Loading devices...</h3>
          <p className="text-muted-foreground mt-2">Connecting to ESP32 at {ipAddress}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-background to-background/80">
      <Sidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        deviceCategories={Object.keys(deviceCategories)}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
        wsConnected={wsConnected}
        wsMessages={wsMessages}
        onSendMessage={wsSendMessage}
        wsEnabled={wsEnabled}
        onToggleWebSocket={toggleWebSocket}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          ipAddress={ipAddress}
          onDisconnect={onDisconnect}
          onToggleSidebar={toggleSidebar}
          wsConnected={wsConnected}
          wsEnabled={wsEnabled}
          onToggleWebSocket={toggleWebSocket}
          onRefresh={refreshDevices}
        />

        <main className="flex-1 overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-16 md:p-6 md:pb-6 safe-area-inset-bottom">
          {error && (
            <Alert variant="destructive" className="mb-4 sm:mb-6 border-destructive/50 shadow-sm">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {wsError && wsEnabled && (
            <Alert variant="warning" className="mb-4 sm:mb-6 border-amber-500/50 shadow-sm">
              <AlertTitle>WebSocket Connection Issue</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>Unable to establish WebSocket connection. You can:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check that your ESP32 is running a WebSocket server on port 81</li>
                    <li>Verify the WebSocket server is configured with the path /ws</li>
                    <li>Disable the WebSocket connection using the toggle in the navbar</li>
                  </ul>
                  <p className="text-sm">
                    You can still control your devices without WebSocket connectivity, but you won't receive real-time
                    updates.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {ipAddress.includes("ngrok") && (
            <Alert className="mb-4 sm:mb-6 border-blue-500/50 shadow-sm">
              <AlertTitle>Using ngrok URL</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>You're connected to an ngrok URL. Keep in mind:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Ngrok URLs are temporary and will change when the tunnel is restarted</li>
                    <li>WebSocket connections may require special configuration on the ESP32 side</li>
                    <li>If you experience connection issues, try connecting directly to the ESP32's IP address</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {devices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[60vh] sm:h-[80vh] text-center px-4"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                <Cpu className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">No devices found</h2>
              <p className="text-muted-foreground mb-6 max-w-md text-sm sm:text-base">
                No devices are registered on your ESP32. Add a device using the button below to get started.
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Devices</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredDevices.length} {filteredDevices.length === 1 ? "device" : "devices"}
                    {activeCategory ? ` of type "${activeCategory}"` : ""}
                  </p>
                </div>
                {activeCategory && (
                  <Button variant="outline" size="sm" onClick={() => setActiveCategory(null)}>
                    Clear Filter
                  </Button>
                )}
              </div>
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

