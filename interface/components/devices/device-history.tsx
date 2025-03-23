"use client"

import { useState, useEffect } from "react"
import type { DeviceType } from "@/types/device-types"
import { useWebSocket } from "@/hooks/use-websocket"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface DeviceHistoryProps {
  device: DeviceType
  ipAddress: string
}

interface HistoryEntry {
  timestamp: string
  state: string
}

export function DeviceHistory({ device, ipAddress }: DeviceHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const { lastMessage } = useWebSocket(ipAddress)

  // Initialize with current state
  useEffect(() => {
    setHistory([
      {
        timestamp: new Date().toLocaleString(),
        state: device.state,
      },
    ])
  }, [device.id])

  // Process WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage)

        // Check if this message is for this device
        if (data.deviceId === device.id && data.state !== undefined) {
          addHistoryEntry(data.state)
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON messages
      }
    }
  }, [lastMessage, device.id])

  const addHistoryEntry = (state: string) => {
    setHistory((prev) => {
      // Only add if state is different from the last entry
      if (prev.length > 0 && prev[0].state === state) {
        return prev
      }

      const newEntry = {
        timestamp: new Date().toLocaleString(),
        state,
      }

      const newHistory = [newEntry, ...prev]

      // Keep only the last 50 entries
      if (newHistory.length > 50) {
        return newHistory.slice(0, 50)
      }

      return newHistory
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">State History</h3>
        <Badge variant="outline">{history.length} entries</Badge>
      </div>

      <ScrollArea className="h-[300px] rounded-md border">
        {history.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No history available</div>
        ) : (
          <div className="p-4 space-y-2">
            {history.map((entry, index) => (
              <div key={index} className="flex justify-between py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{entry.timestamp}</span>
                <Badge variant="secondary">{entry.state}</Badge>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

