"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface WebSocketLogProps {
  messages: string[]
  connected: boolean
  onSendMessage?: (message: string) => boolean
  compact?: boolean
}

export function WebSocketLog({ messages, connected, onSendMessage, compact = false }: WebSocketLogProps) {
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
            {connected ? (
              <Wifi className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className="text-sm font-medium">{connected ? "Connected" : "Disconnected"}</span>
          </div>
          <Badge variant="outline">Port 81</Badge>
        </div>

        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-2 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 text-sm">No messages yet</div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className="text-sm border-l-2 border-primary pl-2 py-1">
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
              disabled={!connected}
              onKeyDown={handleKeyDown}
              className="text-sm"
            />
            <Button size="sm" onClick={handleSendMessage} disabled={!connected || !inputMessage.trim()}>
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
          <Badge variant={connected ? "default" : "destructive"} className="flex items-center gap-1">
            {connected ? (
              <>
                <Wifi className="h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ScrollArea className="h-[300px] rounded-md border p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No messages yet</div>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div key={index} className="border-l-2 border-primary pl-3 py-1">
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
            disabled={!connected}
            onKeyDown={handleKeyDown}
          />
          <Button onClick={handleSendMessage} disabled={!connected || !inputMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

