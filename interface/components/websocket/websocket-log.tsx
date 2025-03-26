"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Wifi, WifiOff, Power } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface WebSocketLogProps {
  messages: string[]
  connected: boolean
  enabled: boolean
  onSendMessage?: (message: string) => boolean
  onToggle?: () => void
  compact?: boolean
}

export function WebSocketLog({
  messages,
  connected,
  enabled,
  onSendMessage,
  onToggle,
  compact = false,
}: WebSocketLogProps) {
  const [inputMessage, setInputMessage] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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

  if (compact) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-2 border-b flex items-center justify-between">
          <div className="flex items-center">
            {!enabled ? (
              <Power className="h-4 w-4 text-gray-400 mr-2" />
            ) : connected ? (
              <Wifi className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-500 mr-2" />
            )}
            <span className="text-sm font-medium">
              {!enabled ? "Disabled" : connected ? "Connected" : "Connecting..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="ws-toggle-compact" checked={enabled} onCheckedChange={onToggle}  />
            <Badge variant="outline">Port 81</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-2 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 text-sm">
                {!enabled ? "WebSocket is disabled" : connected ? "No messages yet" : "Attempting to connect..."}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`text-sm border-l-2 pl-2 py-1 ${
                    message.includes("error") || message.includes("failed")
                      ? "border-destructive text-destructive"
                      : message.includes("established") || message.includes("Connected")
                        ? "border-green-500"
                        : "border-primary"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</div>
                  <div className="break-all">{message}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-2 border-t">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send message..."
              disabled={!connected || !enabled}
              onKeyDown={handleKeyDown}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSendMessage} disabled={!connected || !enabled || !inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">WebSocket Log</CardTitle>
          <div className="flex items-center gap-2">
            <Switch id="ws-toggle-full" checked={enabled} onCheckedChange={onToggle} />
            <Label htmlFor="ws-toggle-full">
              {!enabled ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Power className="h-3 w-3" />
                  Disabled
                </Badge>
              ) : connected ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Connecting...
                </Badge>
              )}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ScrollArea className="h-[300px] rounded-md border p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {!enabled ? "WebSocket is disabled" : connected ? "No messages yet" : "Attempting to connect..."}
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`border-l-2 pl-3 py-1 ${
                    message.includes("error") || message.includes("failed")
                      ? "border-destructive text-destructive"
                      : message.includes("established") || message.includes("Connected")
                        ? "border-green-500"
                        : "border-primary"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{new Date().toLocaleTimeString()}</div>
                  <pre className="text-sm whitespace-pre-wrap break-all">{message}</pre>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex w-full space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message to send..."
            disabled={!connected || !enabled}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSendMessage} disabled={!connected || !enabled || !inputMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

