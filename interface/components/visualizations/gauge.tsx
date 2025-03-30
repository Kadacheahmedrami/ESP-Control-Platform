"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GaugeProps {
  value: number
  min: number
  max: number
  label: string
  type: string
}

export function Gauge({ value, min, max, label, type }: GaugeProps) {
  const [percentage, setPercentage] = useState(0)

  useEffect(() => {
    // Calculate percentage for the gauge
    const calculatedPercentage = ((value - min) / (max - min)) * 100
    setPercentage(Math.min(Math.max(calculatedPercentage, 0), 100))
  }, [value, min, max])

  // Determine color based on sensor type and value
  const getColor = () => {
    if (type === "temperature") {
      if (value < 10) return "text-blue-500"
      if (value > 30) return "text-red-500"
      return "text-green-500"
    }

    if (type === "humidity") {
      if (value < 30) return "text-amber-500"
      if (value > 70) return "text-blue-500"
      return "text-green-500"
    }

    if (type === "pressure") {
      if (value < 980) return "text-amber-500"
      if (value > 1030) return "text-blue-500"
      return "text-green-500"
    }

    // Default color
    return "text-primary"
  }

  const color = getColor()

  return (
    <div className="relative w-full aspect-[2/1]  ">
      <svg viewBox="0 -5 200 100" className="w-full h-[105%]  ">
        {/* Gauge background */}
        <path
          d="M20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Gauge value */}
        <motion.path
          d="M20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={color}
          strokeDasharray="160"
          initial={{ strokeDashoffset: 160 }}
          animate={{ strokeDashoffset: 160 - percentage * 1.6 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Min label */}
        <text x="20" y="95" fontSize="8" textAnchor="middle" className="fill-muted-foreground">
          {min}
        </text>

        {/* Max label */}
        <text x="180" y="95" fontSize="8" textAnchor="middle" className="fill-muted-foreground">
          {max}
        </text>

        {/* Value display */}
        <text
          x="100"
          y="75"
          fontSize="18"
          textAnchor="middle"
          fontWeight="bold"
          className={cn("fill-foreground", color)}
        >
          {label}
        </text>

        {/* Sensor type */}
        <text x="100" y="55" fontSize="10" textAnchor="middle" className="fill-muted-foreground capitalize">
          {type}
        </text>
      </svg>
    </div>
  )
}

