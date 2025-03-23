export interface Device {
  id: string
  type: string
  pins: number[]
  state: string
  interfaceType: string
  direction: string
}

// Add a new interface for creating devices
export interface CreateDevicePayload {
  id?: string
  type: string
  pins?: number[]
  pin?: number
  state?: string
  interfaceType: string
  direction: string
}

