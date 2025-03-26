"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Server, Wifi } from "lucide-react"
import { motion } from "framer-motion"
import { apiService } from "@/services/api-service"
import { ThemeToggle } from "@/components/theme/theme-toggle"

interface ConnectionFormProps {
  onConnect: (ipAddress: string) => void
  initialIpAddress?: string
}

export function ConnectionForm({ onConnect, initialIpAddress = "" }: ConnectionFormProps) {
  const [ipAddress, setIpAddress] = useState(initialIpAddress)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  
  const validateAddress = (address: string) => {
    // IPv4 address validation (without protocol)
    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  
    // Domain name validation with optional protocol
    const domainRegex =
      /^(https?:\/\/)?[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+\/?$/
  
    // Simple hostname validation (one word, letters, numbers, and hyphens)
    const hostnameRegex = /^[a-zA-Z0-9-]{1,63}$/
  
    return ipRegex.test(address) || domainRegex.test(address) || hostnameRegex.test(address)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateAddress(ipAddress)) {
      setError("Please enter a valid IP address, domain name, or hostname")
      return
    }

    setIsValidating(true)

    try {
      // Test connection to the ESP32 device via /api/devices endpoint
      await apiService.testConnection(ipAddress)
      onConnect(ipAddress)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="border-2 shadow-lg glass-effect">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <Server className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-3xl text-center">ESP32 IoT Control Panel</CardTitle>
          <CardDescription className="text-center text-base">
            Connect to your ESP32 device to monitor and control your IoT devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="192.168.1.100 or example.ngrok-free.app"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    disabled={isValidating}
                    className="pl-10 h-12 text-lg"
                  />
                  <Wifi className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter an IP address, hostname, domain name, or ngrok URL. (Note: The WebSocket server runs on port 81.)
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full h-12 text-lg" onClick={handleSubmit} disabled={isValidating}>
            {isValidating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
