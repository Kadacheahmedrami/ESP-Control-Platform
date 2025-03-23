"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState, useEffect } from "react"
import type { DeviceType } from "@/types/device-types"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, RotateCw, RotateCcw } from "lucide-react"
import { HexColorPicker } from "react-colorful"
import { cn } from "@/lib/utils"
import { SensorDisplay } from "@/components/devices/sensor-display"

interface DeviceControlsProps {
  device: DeviceType
  onUpdateState: (newState: string) => Promise<void>
  isUpdating: boolean
  ipAddress: string
}

export function DeviceControls({ device, onUpdateState, isUpdating, ipAddress }: DeviceControlsProps) {
  // Render different controls based on device type
  switch (device.type) {
    case "led":
      return <LedControls device={device} onUpdateState={onUpdateState} isUpdating={isUpdating} />

    case "servo":
      return <ServoControls device={device} onUpdateState={onUpdateState} isUpdating={isUpdating} />

    case "stepper":
      return <StepperControls device={device} onUpdateState={onUpdateState} isUpdating={isUpdating} />

    case "motor":
      return <MotorControls device={device} onUpdateState={onUpdateState} isUpdating={isUpdating} />

    case "relay":
      return <RelayControls device={device} onUpdateState={onUpdateState} isUpdating={isUpdating} />

    case "ledstrip":
      return <LedStripControls device={device} onUpdateState={onUpdateState} isUpdating={isUpdating} />

    case "sensor":
      return <SensorDisplay device={device} ipAddress={ipAddress} />

    default:
      return <GenericControls device={device} onUpdateState={onUpdateState} isUpdating={isUpdating} />
  }
}

// LED Controls Component
function LedControls({ device, onUpdateState, isUpdating }: Omit<DeviceControlsProps, "ipAddress">) {
  const isOn = device.state === "on" || device.state === "1" || device.state === "true"

  const handleToggle = (checked: boolean) => {
    onUpdateState(checked ? "on" : "off")
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor={`led-${device.id}`}>Power</Label>
        <div className="flex items-center space-x-2">
          <Switch id={`led-${device.id}`} checked={isOn} onCheckedChange={handleToggle} disabled={isUpdating} />
          <span className="text-sm font-medium">{isOn ? "ON" : "OFF"}</span>
        </div>
      </div>

      <div
        className={cn(
          "w-full h-24 rounded-md transition-colors flex items-center justify-center",
          isOn ? "bg-yellow-400 animate-pulse-slow" : "bg-gray-200 dark:bg-gray-700",
        )}
      >
        {isOn ? (
          <span className="text-black font-medium">ILLUMINATED</span>
        ) : (
          <span className="text-muted-foreground">OFF</span>
        )}
      </div>
    </div>
  )
}

// Servo Controls Component
function ServoControls({ device, onUpdateState, isUpdating }: Omit<DeviceControlsProps, "ipAddress">) {
  const [angle, setAngle] = useState(Number.parseInt(device.state) || 90)

  useEffect(() => {
    // Update angle when device state changes externally
    const newAngle = Number.parseInt(device.state)
    if (!isNaN(newAngle) && newAngle !== angle) {
      setAngle(newAngle)
    }
  }, [device.state])

  const handleSliderChange = (value: number[]) => {
    setAngle(value[0])
  }

  const handleSliderCommit = () => {
    onUpdateState(angle.toString())
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Angle: {angle}°</Label>
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      <Slider
        value={[angle]}
        min={0}
        max={180}
        step={1}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        disabled={isUpdating}
      />

      <div className="flex justify-between mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAngle(0)
            onUpdateState("0")
          }}
          disabled={isUpdating}
          className="h-8"
        >
          0°
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAngle(90)
            onUpdateState("90")
          }}
          disabled={isUpdating}
          className="h-8"
        >
          90°
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAngle(180)
            onUpdateState("180")
          }}
          disabled={isUpdating}
          className="h-8"
        >
          180°
        </Button>
      </div>
    </div>
  )
}

// Stepper Motor Controls Component
function StepperControls({ device, onUpdateState, isUpdating }: Omit<DeviceControlsProps, "ipAddress">) {
  const [steps, setSteps] = useState(100)
  const [speed, setSpeed] = useState(500)
  const [direction, setDirection] = useState("cw")

  const handleMove = () => {
    // Format: steps:speed:direction
    const command = `${steps}:${speed}:${direction}`
    onUpdateState(command)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="steps">Steps</Label>
          <Input
            id="steps"
            type="number"
            min={1}
            max={10000}
            value={steps}
            onChange={(e) => setSteps(Number.parseInt(e.target.value) || 100)}
            disabled={isUpdating}
            className="h-8"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="speed">Speed (RPM)</Label>
          <Input
            id="speed"
            type="number"
            min={1}
            max={1000}
            value={speed}
            onChange={(e) => setSpeed(Number.parseInt(e.target.value) || 500)}
            disabled={isUpdating}
            className="h-8"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant={direction === "ccw" ? "default" : "outline"}
          size="sm"
          onClick={() => setDirection("ccw")}
          disabled={isUpdating}
          className="flex-1 mr-2 h-8"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          CCW
        </Button>
        <Button
          variant={direction === "cw" ? "default" : "outline"}
          size="sm"
          onClick={() => setDirection("cw")}
          disabled={isUpdating}
          className="flex-1 h-8"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          CW
        </Button>
      </div>

      <Button className="w-full" onClick={handleMove} disabled={isUpdating} size="sm">
        {isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Moving...
          </>
        ) : (
          "Move Motor"
        )}
      </Button>
    </div>
  )
}

// Motor Controls Component
function MotorControls({ device, onUpdateState, isUpdating }: Omit<DeviceControlsProps, "ipAddress">) {
  const [isRunning, setIsRunning] = useState(device.state !== "off" && device.state !== "0")
  const [speed, setSpeed] = useState(() => {
    // Parse speed from state (format: on:speed or off)
    if (device.state.includes(":")) {
      const parts = device.state.split(":")
      return Number.parseInt(parts[1]) || 50
    }
    return 50
  })
  const [direction, setDirection] = useState("forward")

  const handleToggle = (checked: boolean) => {
    setIsRunning(checked)
    const newState = checked ? `on:${speed}:${direction}` : "off"
    onUpdateState(newState)
  }

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value[0])
    if (isRunning) {
      onUpdateState(`on:${value[0]}:${direction}`)
    }
  }

  const handleDirectionChange = (newDirection: string) => {
    setDirection(newDirection)
    if (isRunning) {
      onUpdateState(`on:${speed}:${newDirection}`)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={`motor-${device.id}`}>Power</Label>
        <div className="flex items-center space-x-2">
          <Switch id={`motor-${device.id}`} checked={isRunning} onCheckedChange={handleToggle} disabled={isUpdating} />
          <span className="text-sm font-medium">{isRunning ? "ON" : "OFF"}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <Label>Speed: {speed}%</Label>
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        <Slider
          value={[speed]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => setSpeed(value[0])}
          onValueCommit={() => handleSpeedChange([speed])}
          disabled={!isRunning || isUpdating}
        />
      </div>

      <div className="flex justify-between">
        <Button
          variant={direction === "forward" ? "default" : "outline"}
          size="sm"
          onClick={() => handleDirectionChange("forward")}
          disabled={!isRunning || isUpdating}
          className="flex-1 mr-2 h-8"
        >
          Forward
        </Button>
        <Button
          variant={direction === "reverse" ? "default" : "outline"}
          size="sm"
          onClick={() => handleDirectionChange("reverse")}
          disabled={!isRunning || isUpdating}
          className="flex-1 h-8"
        >
          Reverse
        </Button>
      </div>
    </div>
  )
}

// Relay Controls Component
function RelayControls({ device, onUpdateState, isUpdating }: Omit<DeviceControlsProps, "ipAddress">) {
  const isOn = device.state === "on" || device.state === "1" || device.state === "true"

  const handleToggle = (checked: boolean) => {
    onUpdateState(checked ? "on" : "off")
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor={`relay-${device.id}`}>Power</Label>
        <div className="flex items-center space-x-2">
          <Switch id={`relay-${device.id}`} checked={isOn} onCheckedChange={handleToggle} disabled={isUpdating} />
          <span className="text-sm font-medium">{isOn ? "ON" : "OFF"}</span>
        </div>
      </div>

      <div
        className={cn(
          "w-full h-24 rounded-md flex items-center justify-center font-medium transition-colors",
          isOn ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700",
        )}
      >
        {isOn ? "ACTIVE" : "INACTIVE"}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 mr-2"
          onClick={() => onUpdateState("off")}
          disabled={!isOn || isUpdating}
        >
          Turn Off
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onUpdateState("on")}
          disabled={isOn || isUpdating}
        >
          Turn On
        </Button>
      </div>
    </div>
  )
}

// LED Strip Controls Component
function LedStripControls({ device, onUpdateState, isUpdating }: Omit<DeviceControlsProps, "ipAddress">) {
  const [color, setColor] = useState("#ff0000")
  const [brightness, setBrightness] = useState(100)
  const [mode, setMode] = useState("solid")
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleUpdateLedStrip = () => {
    // Format: mode:color:brightness
    const hexColor = color.replace("#", "")
    const command = `${mode}:${hexColor}:${brightness}`
    onUpdateState(command)
  }

  const modes = [
    { value: "solid", label: "Solid" },
    { value: "blink", label: "Blink" },
    { value: "breath", label: "Breath" },
    { value: "rainbow", label: "Rainbow" },
    { value: "chase", label: "Chase" },
  ]

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="grid grid-cols-3 gap-1">
          {modes.slice(0, 3).map((m) => (
            <Button
              key={m.value}
              variant={mode === m.value ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m.value)}
              disabled={isUpdating}
              className="px-2 py-1 h-8 text-xs"
            >
              {m.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {modes.slice(3).map((m) => (
            <Button
              key={m.value}
              variant={mode === m.value ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m.value)}
              disabled={isUpdating}
              className="px-2 py-1 h-8 text-xs"
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {mode !== "rainbow" && (
        <div className="space-y-1">
          <Label>Color</Label>
          <div
            className="h-8 rounded-md cursor-pointer border"
            style={{ backgroundColor: color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />

          {showColorPicker && (
            <div className="mt-1">
              <HexColorPicker color={color} onChange={setColor}  />
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between">
          <Label>Brightness: {brightness}%</Label>
        </div>
        <Slider
          value={[brightness]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => setBrightness(value[0])}
          disabled={isUpdating}
        />
      </div>

      <Button className="w-full" onClick={handleUpdateLedStrip} disabled={isUpdating} size="sm">
        {isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating...
          </>
        ) : (
          "Apply Settings"
        )}
      </Button>
    </div>
  )
}

// Generic Controls Component for any device type
function GenericControls({ device, onUpdateState, isUpdating }: Omit<DeviceControlsProps, "ipAddress">) {
  const [newState, setNewState] = useState(device.state)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateState(newState)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Current State</Label>
        <Badge variant="outline">{device.state}</Badge>
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={newState}
          onChange={(e) => setNewState(e.target.value)}
          placeholder="Enter new state"
          disabled={isUpdating}
          className="flex-1"
        />
        <Button type="submit" disabled={isUpdating || !newState}>
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
        </Button>
      </form>
    </div>
  )
}

