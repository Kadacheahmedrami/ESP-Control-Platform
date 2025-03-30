import type { DeviceType } from "@/types/device-types"

class ApiService {
  // Helper function: returns protocol based on address.
  // IPv4 addresses (only numbers and dots) use http,
  // while domain names use https.
  private getProtocol(address: string): string {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    return ipRegex.test(address) ? "http://" : "https://"
  }

  // Helper function to build the full URL for an endpoint.
  private buildUrl(address: string, endpoint: string): string {
    const protocol = this.getProtocol(address)
    return `${protocol}${address}${endpoint}`
  }

  // Test connection to the ESP32
  async testConnection(address: string): Promise<boolean> {
    try {
      const url = this.buildUrl(address, "/api/devices")
      console.log(`Testing connection to: ${url}`)

      const response = await fetch(url, {
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
          throw new Error("Connection timed out. Please check the address and ensure the ESP32 is online.")
        }
        throw err
      }
      throw new Error("Failed to connect to the ESP32 device")
    }
  }

  // Get all devices from the ESP32
  async getDevices(address: string): Promise<DeviceType[]> {
    try {
      const url = this.buildUrl(address, "/api/devices")
      const response = await fetch(url, {
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

  // Get a specific device's state
  async getDeviceState(address: string, deviceId: string): Promise<string> {
    try {
      const url = this.buildUrl(address, `/api/device/${deviceId}`)
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch device state: ${response.status} ${response.statusText}`)
      }

      // The response might be plain text or JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        return data.state || data.value || "unknown"
      } else {
        return await response.text()
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

  // Add a new device to the ESP32 - Updated to match ESP32's expected format
  async addDevice(address: string, device: Omit<DeviceType, "id">, existingDevices: DeviceType[] = []): Promise<void> {
    try {
      // Generate a simple sequential name based on device type
      const deviceType = device.type.toLowerCase()

      // Count existing devices of the same type
      const sameTypeDevices = existingDevices.filter((d) => d.type.toLowerCase() === deviceType)

      // Create a simple name: type + next number
      const nextNumber = sameTypeDevices.length + 1
      const deviceId = `${deviceType}${nextNumber}`

      // Format JSON exactly as the ESP32 expects
      const deviceData = {
        id: deviceId,
        type: device.type,
        pins: device.pins,
        interfaceType: device.interfaceType,
        direction: device.direction,
      }

      const url = this.buildUrl(address, "/api/device")
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deviceData),
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
  async updateDeviceState(address: string, deviceId: string, state: string): Promise<void> {
    try {
      const url = this.buildUrl(address, `/api/device/${deviceId}`)
      const response = await fetch(url, {
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

  // Update a device's pins
  async updateDevicePins(address: string, deviceId: string, pins: number[]): Promise<void> {
    try {
      const url = this.buildUrl(address, `/api/device/${deviceId}/pins`)
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pins }),
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to update device pins: ${response.status} ${response.statusText}`)
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

  // Delete a device
  async deleteDevice(address: string, deviceId: string): Promise<void> {
    try {
      const url = this.buildUrl(address, `/api/device/${deviceId}`)
      const response = await fetch(url, {
        method: "DELETE",
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete device: ${response.status} ${response.statusText}`)
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

