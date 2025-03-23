"use client"

import { useState } from "react"
import { IPForm } from "@/components/ip-form"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const [ipAddress, setIpAddress] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)

  const handleConnect = (ip: string) => {
    setIpAddress(ip)
    setIsConnected(true)
  }

  const handleDisconnect = () => {
    setIpAddress("")
    setIsConnected(false)
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ESP32 Device Manager</h1>

        {!isConnected ? (
          <IPForm onConnect={handleConnect} />
        ) : (
          <Dashboard ipAddress={ipAddress} onDisconnect={handleDisconnect} />
        )}
      </div>
    </main>
  )
}

