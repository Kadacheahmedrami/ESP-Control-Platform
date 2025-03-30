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
      if (value > 25) return "text-amber-500"
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

    if (type === "light") {
      if (value < 200) return "text-blue-500"
      if (value > 800) return "text-amber-500"
      return "text-green-500"
    }

    // Default color
    return "text-primary"
  }

  const color = getColor()

  // Calculate tick marks for better visual reference
  const generateTicks = () => {
    const ticks = []
    const numTicks = 5 // Number of tick marks (including min and max)
    const step = (max - min) / (numTicks - 1)

    for (let i = 0; i < numTicks; i++) {
      const value = min + i * step
      const angle = (i * 180) / (numTicks - 1)
      const x = 100 - 80 * Math.cos((angle * Math.PI) / 180)
      const y = 80 - 80 * Math.sin((angle * Math.PI) / 180)

      ticks.push({
        value: Math.round(value * 10) / 10, // Round to 1 decimal place
        x,
        y,
        tickX1: x - 3 * Math.cos((angle * Math.PI) / 180),
        tickY1: y - 3 * Math.sin((angle * Math.PI) / 180),
        tickX2: x + 3 * Math.cos((angle * Math.PI) / 180),
        tickY2: y + 3 * Math.sin((angle * Math.PI) / 180),
      })
    }

    return ticks
  }

  const ticks = generateTicks()

  return (
    <div className="relative w-full aspect-[2/1] p-2">
      <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
        {/* Gauge background with gradient */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--blue-500))" />
            <stop offset="50%" stopColor="hsl(var(--green-500))" />
            <stop offset="100%" stopColor="hsl(var(--red-500))" />
          </linearGradient>
        </defs>

        {/* Gauge background */}
        <path
          d="M20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Gauge value */}
        <motion.path
          d="M20 80 A 60 60 0 0 1 180 80"
          fill="none"
          stroke={type === "temperature" ? "url(#gaugeGradient)" : "currentColor"}
          strokeWidth="10"
          strokeLinecap="round"
          className={type !== "temperature" ? color : ""}
          strokeDasharray="160"
          initial={{ strokeDashoffset: 160 }}
          animate={{ strokeDashoffset: 160 - percentage * 1.6 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <g key={i}>
            <line
              x1={tick.tickX1}
              y1={tick.tickY1}
              x2={tick.tickX2}
              y2={tick.tickY2}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1.5"
            />
            <text x={tick.x} y={tick.y + 12} fontSize="7" textAnchor="middle" className="fill-muted-foreground">
              {tick.value}
            </text>
          </g>
        ))}

        {/* Needle */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: percentage * 1.8 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: "100px 80px" }}
        >
          <line
            x1="100"
            y1="80"
            x2="100"
            y2="30"
            stroke={`hsl(var(--${color.replace("text-", "")}))`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="100" cy="80" r="4" fill={`hsl(var(--${color.replace("text-", "")}))`} />
        </motion.g>

        {/* Value display */}
        <rect
          x="70"
          y="55"
          width="60"
          height="20"
          rx="4"
          fill="hsl(var(--card))"
          className="stroke-border"
          strokeWidth="1"
        />

        <text
          x="100"
          y="68"
          fontSize="12"
          textAnchor="middle"
          fontWeight="bold"
          className={cn("fill-foreground", color)}
        >
          {label}
        </text>

        {/* Sensor type */}
        <text x="100" y="40" fontSize="10" textAnchor="middle" className="fill-muted-foreground capitalize font-medium">
          {type}
        </text>
      </svg>
    </div>
  )
}

