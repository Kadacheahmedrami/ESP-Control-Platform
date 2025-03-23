"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Device } from "@/lib/types"

interface DeviceFormProps {
  onAddDevice: (device: Omit<Device, "id">) => Promise<void>
}

export function DeviceForm({ onAddDevice }: DeviceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    pins: "",
    state: "",
    interfaceType: "",
    direction: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if pins contains a single value or multiple values
      const pinsString = formData.pins.trim()
      const deviceData: any = {
        type: formData.type,
        state: formData.state || "unknown",
        interfaceType: formData.interfaceType,
        direction: formData.direction,
      }

      // If there's a comma, treat as multiple pins
      if (pinsString.includes(",")) {
        // Convert pins from comma-separated string to array of numbers
        deviceData.pins = pinsString.split(",").map((pin) => Number.parseInt(pin.trim(), 10))
      } else {
        // Single pin
        deviceData.pin = Number.parseInt(pinsString, 10)
      }

      await onAddDevice(deviceData)

      // Reset form after successful submission
      setFormData({
        type: "",
        pins: "",
        state: "",
        interfaceType: "",
        direction: "",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Device</CardTitle>
        <CardDescription>Register a new device on your ESP32</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Device Type</Label>
              <Select onValueChange={(value) => handleSelectChange("type", value)} value={formData.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="led">LED</SelectItem>
                  <SelectItem value="button">Button</SelectItem>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="relay">Relay</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pins">Pins (comma separated)</Label>
              <Input
                id="pins"
                name="pins"
                placeholder="e.g. 13, 14, 15"
                value={formData.pins}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Initial State</Label>
              <Input
                id="state"
                name="state"
                placeholder="e.g. on, off, 0, 1"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interfaceType">Interface Type</Label>
              <Select
                onValueChange={(value) => handleSelectChange("interfaceType", value)}
                value={formData.interfaceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="analog">Analog</SelectItem>
                  <SelectItem value="pwm">PWM</SelectItem>
                  <SelectItem value="i2c">I2C</SelectItem>
                  <SelectItem value="spi">SPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select onValueChange={(value) => handleSelectChange("direction", value)} value={formData.direction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="input">Input</SelectItem>
                  <SelectItem value="output">Output</SelectItem>
                  <SelectItem value="inputPullup">Input Pullup</SelectItem>
                  <SelectItem value="inputPulldown">Input Pulldown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.type || !formData.pins || !formData.interfaceType || !formData.direction}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Device...
            </>
          ) : (
            "Add Device"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

