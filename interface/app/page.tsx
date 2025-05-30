"use client"

import { useState, useEffect } from "react"
import { ConnectionForm } from "@/components/connection/connection-form"
import { Dashboard } from "@/components/dashboard/dashboard"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { ThemeProvider } from "@/components/theme/theme-provider"

export default function Home() {
  const [ipAddress, setIpAddress] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const { getItem, setItem } = useLocalStorage()
  const { toast } = useToast()

  // Load the last used IP address and connection state from localStorage on initial render
  useEffect(() => {
    const savedIp = getItem("esp32-ip-address")
    const savedConnectionState = getItem("esp32-connected")

    if (savedIp) {
      setIpAddress(savedIp)

      // If there was a previous connection, automatically reconnect
      if (savedConnectionState === "true") {
        setIsConnected(true)
      }
    }
  }, [getItem])

  const handleConnect = (address: string) => {
    setIpAddress(address)
    setItem("esp32-ip-address", address)
    setIsConnected(true)
    setItem("esp32-connected", "true") // Save connection state
    toast({
      title: "Connected",
      description: `Successfully connected to ESP32 at ${address}`,
    })
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setItem("esp32-connected", "false") // Update connection state
    toast({
      title: "Disconnected",
      description: "Disconnected from ESP32 device",
    })
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <main className="min-h-screen bg-background">
        {!isConnected ? (
          <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8 flex flex-col items-center justify-center min-h-screen">
            <ConnectionForm onConnect={handleConnect} initialIpAddress={ipAddress} />
          </div>
        ) : (
          <Dashboard ipAddress={ipAddress} onDisconnect={handleDisconnect} />
        )}
        <Toaster />
      </main>
    </ThemeProvider>
  )
}

