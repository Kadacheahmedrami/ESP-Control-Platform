"use client"

import { useState, useEffect, useCallback } from "react"
import type { DeviceType } from "@/types/device-types"
import { apiService } from "@/services/api-service"
import { useToast } from "@/components/ui/use-toast"

export function useDevices(ipAddress: string) {
  const [devices, setDevices] = useState<DeviceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Function to fetch devices from the ESP32
  const fetchDevices = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const fetchedDevices = await apiService.getDevices(ipAddress)
      setDevices(fetchedDevices)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch devices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [ipAddress, toast])

  // Function to add a new device
  const addDevice = useCallback(
    async (device: Omit<DeviceType, "id">) => {
      setError(null)

      try {
        await apiService.addDevice(ipAddress, device)
        toast({
          title: "Device Added",
          description: "New device has been added successfully",
        })
        await fetchDevices()
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An unknown error occurred")
        }
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to add device",
          variant: "destructive",
        })
        throw err
      }
    },
    [ipAddress, fetchDevices, toast],
  )

  // Function to update a device's state
  const updateDeviceState = useCallback(
    async (deviceId: string, state: string) => {
      setError(null)

      try {
        await apiService.updateDeviceState(ipAddress, deviceId, state)

        // Update the local state to reflect the change
        setDevices((prevDevices) =>
          prevDevices.map((device) => (device.id === deviceId ? { ...device, state } : device)),
        )

        toast({
          title: "Device Updated",
          description: `${deviceId} state changed to ${state}`,
        })
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("An unknown error occurred")
        }
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update device",
          variant: "destructive",
        })
        throw err
      }
    },
    [ipAddress, toast],
  )

  // Fetch devices on initial render
  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  return {
    devices,
    loading,
    error,
    refreshDevices: fetchDevices,
    addDevice,
    updateDeviceState,
  }
}

