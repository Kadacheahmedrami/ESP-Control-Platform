import type { DeviceType } from "@/types/device-types"

class ApiService {
  // Test connection to the ESP32
  async testConnection(ipAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`http://${ipAddress}/api/devices`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status} ${response.statusText}`)
      }

      // Try to parse the response as JSON to verify it's valid
      await response.json()
      return true
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("Connection timed out. Please check the IP address and ensure the ESP32 is online.")
        }
        throw err
      }
      throw new Error("Failed to connect to the ESP32 device")
    }
  }

  // Get all devices from the ESP32
  async getDevices(ipAddress: string): Promise<DeviceType[]> {
    try {
      const response = await fetch(`http://${ipAddress}/api/devices`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("Request timed out. Please check your connection.")
        }
        throw err
      }
      throw new Error("An unknown error occurred")
    }
  }

  // Add a new device to the ESP32 - FIXED to match ESP32's expected format
  async addDevice(ipAddress: string, device: Omit<DeviceType, "id">): Promise<void> {
    try {
      // Generate a unique ID for the device based on type and timestamp
      const deviceId = `${device.type}_${Date.now()}`

      // Format JSON exactly as the ESP32 expects
      let jsonBody: string

      // Check if we have a single pin or multiple pins
      if (device.pins.length === 1) {
        // Format with single pin
        jsonBody = `{
          "id":"${deviceId}",
          "type":"${device.type}",
          "pin":${device.pins[0]},
          "interfaceType":"${device.interfaceType}",
          "direction":"${device.direction}"
        }`
      } else {
        // Format with pins array
        jsonBody = `{
          "id":"${deviceId}",
          "type":"${device.type}",
          "pins":[${device.pins.join(",")}],
          "interfaceType":"${device.interfaceType}",
          "direction":"${device.direction}"
        }`
      }

      // Remove whitespace to ensure consistent format
      jsonBody = jsonBody.replace(/\s+/g, "")

      const response = await fetch(`http://${ipAddress}/api/device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonBody,
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to add device: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("Request timed out. Please check your connection.")
        }
        throw err
      }
      throw new Error("An unknown error occurred")
    }
  }

  // Update a device's state
  async updateDeviceState(ipAddress: string, deviceId: string, state: string): Promise<void> {
    try {
      const response = await fetch(`http://${ipAddress}/api/device/${deviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "text/plain",
        },
        body: state,
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to update device: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          throw new Error("Request timed out. Please check your connection.")
        }
        throw err
      }
      throw new Error("An unknown error occurred")
    }
  }
}

export const apiService = new ApiService()

