"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import type { DeviceType } from "@/types/device-types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddDeviceFormProps {
  onAddDevice: (device: Omit<DeviceType, "id">) => Promise<void>
}

export function AddDeviceForm({ onAddDevice }: AddDeviceFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    pins: "",
    state: "",
    interfaceType: "",
    direction: "",
  })
  const [deviceType, setDeviceType] = useState("custom")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDeviceTypeChange = (value: string) => {
    setDeviceType(value)

    // Set default values based on device type
    switch (value) {
      case "led":
        setFormData({
          type: "led",
          pins: "",
          state: "off",
          interfaceType: "digital",
          direction: "output",
        })
        break
      case "servo":
        setFormData({
          type: "servo",
          pins: "",
          state: "90",
          interfaceType: "pwm",
          direction: "output",
        })
        break
      case "stepper":
        setFormData({
          type: "stepper",
          pins: "",
          state: "0",
          interfaceType: "digital",
          direction: "output",
        })
        break
      case "motor":
        setFormData({
          type: "motor",
          pins: "",
          state: "off",
          interfaceType: "pwm",
          direction: "output",
        })
        break
      case "relay":
        setFormData({
          type: "relay",
          pins: "",
          state: "off",
          interfaceType: "digital",
          direction: "output",
        })
        break
      case "ledstrip":
        setFormData({
          type: "ledstrip",
          pins: "",
          state: "solid:ff0000:100",
          interfaceType: "digital",
          direction: "output",
        })
        break
      case "sensor":
        setFormData({
          type: "sensor",
          pins: "",
          state: "0",
          interfaceType: "analog",
          direction: "input",
        })
        break
      default:
        setFormData({
          type: "",
          pins: "",
          state: "",
          interfaceType: "",
          direction: "",
        })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if pins contains a single value or multiple values
      const pinsString = formData.pins.trim()

      // Convert pins from comma-separated string to array of numbers
      const pins = pinsString.split(",").map((pin) => Number.parseInt(pin.trim(), 10))

      const deviceData = {
        type: formData.type,
        pins: pins,
        state: formData.state || "unknown",
        interfaceType: formData.interfaceType,
        direction: formData.direction,
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

      setOpen(false)
    } catch (error) {
      console.error("Error adding device:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>Register a new device on your ESP32. Fill in the details below.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="templates" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Device Templates</TabsTrigger>
            <TabsTrigger value="custom">Custom Device</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                variant={deviceType === "led" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("led")}
              >
                <span className="text-2xl">💡</span>
                <span>LED</span>
              </Button>

              <Button
                variant={deviceType === "servo" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("servo")}
              >
                <span className="text-2xl">🔄</span>
                <span>Servo</span>
              </Button>

              <Button
                variant={deviceType === "stepper" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("stepper")}
              >
                <span className="text-2xl">⚙️</span>
                <span>Stepper</span>
              </Button>

              <Button
                variant={deviceType === "motor" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("motor")}
              >
                <span className="text-2xl">🔌</span>
                <span>Motor</span>
              </Button>

              <Button
                variant={deviceType === "relay" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("relay")}
              >
                <span className="text-2xl">🔘</span>
                <span>Relay</span>
              </Button>

              <Button
                variant={deviceType === "ledstrip" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("ledstrip")}
              >
                <span className="text-2xl">🌈</span>
                <span>LED Strip</span>
              </Button>

              <Button
                variant={deviceType === "sensor" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("sensor")}
              >
                <span className="text-2xl">🌡️</span>
                <span>Sensor</span>
              </Button>

              <Button
                variant={deviceType === "custom" ? "default" : "outline"}
                className="flex flex-col h-24 gap-2"
                onClick={() => handleDeviceTypeChange("custom")}
              >
                <span className="text-2xl">➕</span>
                <span>Custom</span>
              </Button>
            </div>

            {deviceType !== "custom" && (
              <div className="space-y-4 mt-4 border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="device-id">Device ID</Label>
                    <Input id="device-id" name="id" placeholder={`${formData.type}_${Date.now()}`} disabled />
                    <p className="text-xs text-muted-foreground">ID will be auto-generated</p>
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
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 py-4">
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
                    <SelectItem value="servo">Servo</SelectItem>
                    <SelectItem value="stepper">Stepper</SelectItem>
                    <SelectItem value="ledstrip">LED Strip</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !formData.type || !formData.pins || !formData.interfaceType || !formData.direction
            }
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

