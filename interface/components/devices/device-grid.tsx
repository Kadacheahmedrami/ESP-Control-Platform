"use client"

import { DeviceCard } from "@/components/devices/device-card"
import type { DeviceType } from "@/types/device-types"
import { motion } from "framer-motion"

interface DeviceGridProps {
  devices: DeviceType[]
  onUpdateDevice: (deviceId: string, state: string) => Promise<void>
  ipAddress: string
}

export function DeviceGrid({ devices, onUpdateDevice, ipAddress }: DeviceGridProps) {
  // Animation variants for staggered animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {devices.map((device) => (
        <motion.div key={device.id} variants={item}>
          <DeviceCard device={device} onUpdateState={onUpdateDevice} ipAddress={ipAddress} />
        </motion.div>
      ))}
    </motion.div>
  )
}

