"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Send, Power } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WebSocketLogProps {
  messages: string[]
  connected: boolean
  enabled: boolean
  onSendMessage?: (message: string) => boolean
  onToggle?: () => void
}

export function WebSocketLog({ messages, connected, enabled, onSendMessage, onToggle }: WebSocketLogProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [inputMessage, setInputMessage] = useState("")

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (inputMessage.trim() && onSendMessage) {
      const sent = onSendMessage(inputMessage)
      if (sent) {
        setInputMessage("")
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base sm:text-lg">WebSocket Log (Port 81)</CardTitle>
          <div className="flex items-center gap-2">
            <Switch id="websocket-toggle" checked={enabled} onCheckedChange={onToggle} />
            <Label htmlFor="websocket-toggle" className="cursor-pointer">
              {!enabled ? (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Power className="h-3 w-3" />
                  <span className="hidden xs:inline">Disabled</span>
                </Badge>
              ) : connected ? (
                <Badge variant="default" className="flex items-center gap-1 text-xs">
                  <Wifi className="h-3 w-3" />
                  <span className="hidden xs:inline">Connected</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden xs:inline">Connecting...</span>
                </Badge>
              )}
            </Label>
          </div>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Real-time updates from ESP32 WebSocket on port 81
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!enabled && (
          <Alert className="mb-4">
            <AlertDescription>
              WebSocket connection is currently disabled. Toggle the switch above to enable it.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[200px] sm:h-[300px] rounded-md border p-2 sm:p-4 mobile-scroll" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 sm:py-8 text-sm">
              {!enabled ? (
                "WebSocket is disabled"
              ) : connected ? (
                "Waiting for messages..."
              ) : (
                <div>
                  <p>Attempting to connect...</p>
                  <p className="text-xs mt-2 text-amber-500">
                    If connection fails, check that the ESP32 WebSocket server is running on port 81 at the path /ws.
                  </p>
                </div>
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`border-l-2 pl-2 sm:pl-3 py-1 text-xs sm:text-sm ${
                    message.includes("error") || message.includes("failed")
                      ? "border-destructive text-destructive"
                      : message.includes("established") || message.includes("Connected")
                        ? "border-green-500"
                        : "border-primary"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</p>
                  <pre className="whitespace-pre-wrap break-all">{message}</pre>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex w-full gap-2">
          <Input
            placeholder="Type a message to send..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!connected || !enabled}
            className="text-sm"
          />
          <Button onClick={handleSendMessage} disabled={!connected || !enabled || !inputMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

