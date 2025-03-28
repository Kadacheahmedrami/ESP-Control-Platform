"use client"

import { useState } from "react"
import type { DeviceType } from "@/types/device-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DevicePinsEditorProps {
  device: DeviceType
  onUpdatePins: (pins: number[]) => Promise<void>
}

export function DevicePinsEditor({ device, onUpdatePins }: DevicePinsEditorProps) {
  const [pins, setPins] = useState<number[]>([...device.pins])
  const [newPin, setNewPin] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddPin = () => {
    const pinNumber = Number.parseInt(newPin, 10)
    if (!isNaN(pinNumber) && !pins.includes(pinNumber)) {
      setPins([...pins, pinNumber])
      setNewPin("")
    }
  }

  const handleRemovePin = (pinToRemove: number) => {
    setPins(pins.filter((pin) => pin !== pinToRemove))
  }

  const handleSavePins = async () => {
    if (pins.length === 0) {
      setError("Device must have at least one pin")
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      await onUpdatePins(pins)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to update pins")
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Device Pins</h3>
        <Badge variant="outline">{pins.length} pins</Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-pins">Current Pins</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {pins.length > 0 ? (
                  pins.map((pin) => (
                    <Badge key={pin} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      <span>{pin}</span>
                      <button
                        onClick={() => handleRemovePin(pin)}
                        className="ml-1 flex items-center justify-center h-4 w-4 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40"
                        aria-label={`Remove pin ${pin}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No pins assigned</p>
                )}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="new-pin">Add Pin</Label>
                <Input
                  id="new-pin"
                  type="number"
                  placeholder="Enter pin number"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  min="0"
                  max="40"
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleAddPin}
                disabled={!newPin || isNaN(Number.parseInt(newPin, 10)) || pins.includes(Number.parseInt(newPin, 10))}
                size="icon"
                className="h-10 w-10 flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSavePins}
          disabled={isUpdating || pins.length === 0 || JSON.stringify(pins) === JSON.stringify(device.pins)}
          className="flex items-center"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <span className="mr-2">Save Changes</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

