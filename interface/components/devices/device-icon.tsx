import {
  Lightbulb,
  Gauge,
  RotateCw,
  Zap,
  Power,
  Thermometer,
  Droplets,
  Waves,
  Sun,
  type LucideIcon,
} from "lucide-react"

interface DeviceIconProps {
  type: string
  className?: string
}

export function DeviceIcon({ type, className }: DeviceIconProps) {
  // Map device types to appropriate icons
  const getIcon = (): LucideIcon => {
    switch (type.toLowerCase()) {
      case "led":
        return Lightbulb
      case "servo":
        return Gauge
      case "stepper":
        return RotateCw
      case "motor":
        return Zap
      case "relay":
        return Power
      case "ledstrip":
        return Lightbulb
      case "sensor":
        return Thermometer
      case "temperature":
        return Thermometer
      case "humidity":
        return Droplets
      case "pressure":
        return Waves
      case "light":
        return Sun
      default:
        return Gauge
    }
  }

  const IconComponent = getIcon()

  return <IconComponent className={className} />
}

