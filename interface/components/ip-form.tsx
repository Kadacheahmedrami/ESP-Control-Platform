"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface IPFormProps {
  onConnect: (ipAddress: string) => void
}

export function IPForm({ onConnect }: IPFormProps) {
  const [ipAddress, setIpAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateIP = (ip: string) => {
    // Basic IP address validation
    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(ip)
  }

  const testConnection = async (ip: string) => {
    try {
      const response = await fetch(`http://${ip}/api/devices`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status} ${response.statusText}`)
      }

      // Try to parse the response as JSON to verify it's valid
      await response.json()
      return true
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("Connection timed out. Please check the IP address and ensure the ESP32 is online.")
        }
        throw err
      }
      throw new Error("Failed to connect to the ESP32 device")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateIP(ipAddress)) {
      setError("Please enter a valid IP address")
      return
    }

    setIsValidating(true)

    try {
      await testConnection(ipAddress)
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to ESP32</CardTitle>
        <CardDescription>Enter the IP address of your ESP32 device running ESPExpress</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="192.168.1.100"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                disabled={isValidating}
              />
              <p className="text-xs text-muted-foreground">Note: The WebSocket server runs on port 81</p>
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
        <Button type="submit" className="w-full" onClick={handleSubmit} disabled={isValidating}>
          {isValidating ? "Connecting..." : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  )
}

