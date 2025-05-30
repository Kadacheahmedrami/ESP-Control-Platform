"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WebSocketLog } from "@/components/websocket/websocket-log"
import { DeviceIcon } from "@/components/devices/device-icon"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SidebarProps {
  open: boolean
  mobileOpen?: boolean
  onToggle: () => void
  setMobileOpen?: (open: boolean) => void
  deviceCategories: string[]
  activeCategory: string | null
  onCategorySelect: (category: string | null) => void
  wsConnected: boolean
  wsMessages: string[]
  onSendMessage: (message: string) => boolean
  wsEnabled: boolean
  onToggleWebSocket: () => void
}

export function Sidebar({
  open,
  mobileOpen = false,
  onToggle,
  setMobileOpen,
  deviceCategories,
  activeCategory,
  onCategorySelect,
  wsConnected,
  wsMessages,
  onSendMessage,
  wsEnabled,
  onToggleWebSocket,
}: SidebarProps) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(mobileOpen)

  // Use the provided setMobileOpen function if available, otherwise use the internal state
  const handleMobileOpenChange = useCallback(
    (open: boolean) => {
      if (setMobileOpen) {
        setMobileOpen(open)
      } else {
        setInternalMobileOpen(open)
      }
    },
    [setMobileOpen],
  )

  // Use the provided mobileOpen value if available, otherwise use the internal state
  const effectiveMobileOpen = setMobileOpen ? mobileOpen : internalMobileOpen

  const handleCategoryClick = (category: string) => {
    onCategorySelect(activeCategory === category ? null : category)
  }

  // Listen for the toggle event from the navbar
  useEffect(() => {
    const handleNavbarToggle = () => {
      if (window.innerWidth < 768) {
        handleMobileOpenChange(!effectiveMobileOpen)
      }
    }

    // Create a custom event listener for the navbar toggle
    document.addEventListener("toggle-mobile-sidebar", handleNavbarToggle)

    return () => {
      document.removeEventListener("toggle-mobile-sidebar", handleNavbarToggle)
    }
  }, [effectiveMobileOpen, handleMobileOpenChange])

  // Sidebar for desktop
  const DesktopSidebar = (
    <div
      className={cn("hidden md:flex flex-col h-screen border-r transition-all duration-300", open ? "w-64" : "w-14")}
    >
      <div className="flex items-center justify-end p-2">
        <Button variant="ghost" size="icon" onClick={onToggle}>
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="devices" className="h-full flex flex-col">
          <TabsList
            className={cn("justify-center", open ? "grid grid-cols-2" : "flex flex-col items-center space-y-2")}
          >
            <TabsTrigger value="devices" className={cn(!open && "w-10 h-10 p-0")}>
              {open ? "Devices" : <DeviceIcon type="gauge" className="h-4 w-4" />}
            </TabsTrigger>
            <TabsTrigger value="websocket" className={cn(!open && "w-10 h-10 p-0")}>
              {open ? "WebSocket" : <DeviceIcon type="sensor" className="h-4 w-4" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="p-2">
                {open && <h3 className="mb-2 px-4 text-sm font-medium">Device Categories</h3>}
                <div className="space-y-1">
                  {deviceCategories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", !open && "justify-center p-0 h-10 w-10")}
                      onClick={() => handleCategoryClick(category)}
                    >
                      <DeviceIcon type={category} className={cn("h-4 w-4", open && "mr-2")} />
                      {open && <span className="capitalize">{category}</span>}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="websocket" className="flex-1 p-0">
            {open ? (
              <div className="h-full flex flex-col">
                <WebSocketLog
                  messages={wsMessages}
                  connected={wsConnected}
                  enabled={wsEnabled}
                  onSendMessage={onSendMessage}
                  onToggle={onToggleWebSocket}
                  compact={true}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    !wsEnabled ? "bg-gray-400" : wsConnected ? "bg-green-500" : "bg-red-500",
                  )}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )

  // Sidebar for mobile
  const MobileSidebar = (
    <Sheet open={effectiveMobileOpen} onOpenChange={handleMobileOpenChange}>
      <SheetContent side="left" className="p-0">
        <Tabs defaultValue="devices" className="h-full flex flex-col">
          <TabsList className="justify-center grid grid-cols-2">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="websocket">WebSocket</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="flex-1 p-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h3 className="mb-2 px-2 text-sm font-medium">Device Categories</h3>
                <div className="space-y-1">
                  {deviceCategories.map((category) => (
                    <Button
                      key={category}
                      variant={activeCategory === category ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        handleCategoryClick(category)
                        handleMobileOpenChange(false)
                      }}
                    >
                      <DeviceIcon type={category} className="h-4 w-4 mr-2" />
                      <span className="capitalize">{category}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="websocket" className="flex-1 p-0">
            <WebSocketLog
              messages={wsMessages}
              connected={wsConnected}
              enabled={wsEnabled}
              onSendMessage={onSendMessage}
              onToggle={onToggleWebSocket}
              compact={true}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )

  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
    </>
  )
}

