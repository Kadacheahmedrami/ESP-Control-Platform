"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Menu, RefreshCw, Wifi, WifiOff, LogOut, Power } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

interface NavbarProps {
  ipAddress: string
  onDisconnect: () => void
  onToggleSidebar: () => void
  wsConnected: boolean
  wsEnabled: boolean
  onToggleWebSocket: () => void
  onRefresh: () => void
}

export function Navbar({
  ipAddress,
  onDisconnect,
  onToggleSidebar,
  wsConnected,
  wsEnabled,
  onToggleWebSocket,
  onRefresh,
}: NavbarProps) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-2 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Dispatch a custom event to toggle the mobile sidebar
              document.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))

              // Also call the original toggle function for desktop
              onToggleSidebar()
            }}
            className="mr-2 md:hidden touch-target h-10 w-10 flex items-center justify-center"
            aria-label="Toggle sidebar menu"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex items-center">
            <h1 className="text-base sm:text-lg font-semibold truncate">ESP32 Control Panel</h1>
            <Badge variant="outline" className="ml-2 bg-primary/10 hidden sm:flex">
              {ipAddress}
            </Badge>
          </div>

          <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
            {/* On mobile, we'll show a simplified version of the WebSocket status */}
            <div className="hidden sm:flex items-center mr-2">
              <div className="flex items-center gap-2">
                <Switch id="ws-toggle-nav" checked={wsEnabled} onCheckedChange={onToggleWebSocket} className="mr-1" />

                {wsEnabled ? (
                  wsConnected ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10">
                          <Wifi className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">Connected</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>WebSocket connected on port 81</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10">
                          <WifiOff className="h-3 w-3 text-amber-500" />
                          <span className="text-amber-500">Connecting...</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Attempting to connect to WebSocket</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-500/10">
                        <Power className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-500">Disabled</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>WebSocket connection is disabled</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* For mobile, just show a simple indicator */}
            <div className="flex sm:hidden items-center">
              <div
                className={`h-3 w-3 rounded-full ${
                  !wsEnabled ? "bg-gray-400" : wsConnected ? "bg-green-500" : "bg-amber-500"
                }`}
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onRefresh}>
                  <RefreshCw className="h-5 w-5" />
                  <span className="sr-only">Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh devices</p>
              </TooltipContent>
            </Tooltip>

            <ThemeToggle />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onDisconnect}>
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Disconnect</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disconnect from ESP32</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Dialog open={showInfo} onOpenChange={setShowInfo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>About ESP32 Control Panel</DialogTitle>
              <DialogDescription>A modern web interface for controlling ESP32 IoT devices</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Connected to:</h4>
                <p className="text-muted-foreground">{ipAddress}</p>
              </div>
              <div>
                <h4 className="font-medium">WebSocket Status:</h4>
                <p className="text-muted-foreground">
                  {!wsEnabled ? "Disabled" : wsConnected ? "Connected (Port 81)" : "Attempting to connect..."}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Real-time device control</li>
                  <li>WebSocket communication</li>
                  <li>Multiple device types support</li>
                  <li>Responsive design</li>
                  <li>Dark/Light theme</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>
    </TooltipProvider>
  )
}

