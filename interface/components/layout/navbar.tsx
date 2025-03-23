"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Menu, RefreshCw, Wifi, WifiOff, LogOut } from "lucide-react"
import { motion } from "framer-motion"

interface NavbarProps {
  ipAddress: string
  onDisconnect: () => void
  onToggleSidebar: () => void
  wsConnected: boolean
  onRefresh: () => void
}

export function Navbar({ ipAddress, onDisconnect, onToggleSidebar, wsConnected, onRefresh }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="mr-2 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className="flex items-center">
          <h1 className="text-lg font-semibold">ESP32 Control Panel</h1>
          <Badge variant="outline" className="ml-2">
            {ipAddress}
          </Badge>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center mr-2">
            {wsConnected ? (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10">
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-500">Connected</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 bg-red-500/10">
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-500">Disconnected</span>
              </Badge>
            )}
          </motion.div>

          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Refresh</span>
          </Button>

          <ThemeToggle />

          <Button variant="ghost" size="icon" onClick={onDisconnect}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Disconnect</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

