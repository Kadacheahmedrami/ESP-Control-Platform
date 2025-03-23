"use client"
import { DeviceList } from "@/components/device-list"
import { DeviceForm } from "@/components/device-form"
import { WebSocketLog } from "@/components/websocket-log"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"
import { useESP32 } from "@/hooks/use-esp32"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface DashboardProps {
  ipAddress: string
  onDisconnect: () => void
}

export function Dashboard({ ipAddress, onDisconnect }: DashboardProps) {
  const {
    devices,
    loading,
    error,
    wsConnected,
    wsEnabled,
    wsMessages,
    sendWebSocketMessage,
    toggleWebSocket,
    refreshDevices,
    addDevice,
    updateDeviceState,
  } = useESP32(ipAddress)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">ESP32 Dashboard</h2>
          <p className="text-muted-foreground">Connected to: {ipAddress}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="ws-toggle" checked={wsEnabled} onCheckedChange={toggleWebSocket} />
            <Label htmlFor="ws-toggle" className="cursor-pointer">
              {wsEnabled ? (
                wsConnected ? (
                  <span className="flex items-center text-green-500">
                    <Wifi className="h-5 w-5 mr-2" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center text-amber-500">
                    <Wifi className="h-5 w-5 mr-2" />
                    Connecting...
                  </span>
                )
              ) : (
                <span className="flex items-center text-muted-foreground">
                  <WifiOff className="h-5 w-5 mr-2" />
                  Disabled
                </span>
              )}
            </Label>
          </div>

          <Button variant="outline" onClick={onDisconnect}>
            Disconnect
          </Button>

          <Button onClick={refreshDevices}>Refresh</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <DeviceList devices={devices} loading={loading} onUpdateState={updateDeviceState} />

          <DeviceForm onAddDevice={addDevice} />
        </div>

        <div>
          <WebSocketLog
            messages={wsMessages}
            connected={wsConnected && wsEnabled}
            enabled={wsEnabled}
            onSendMessage={sendWebSocketMessage}
            onToggle={toggleWebSocket}
          />
        </div>
      </div>
    </div>
  )
}

