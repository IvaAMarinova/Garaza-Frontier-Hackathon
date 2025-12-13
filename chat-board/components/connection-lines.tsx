"use client"

import type { Node } from "@/lib/types"
import { NODE_COLORS, CENTER_COLOR } from "@/lib/colors"

type ConnectionLinesProps = {
  nodes: Node[]
  isDarkMode: boolean
}

export function ConnectionLines({ nodes, isDarkMode }: ConnectionLinesProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {nodes.map((node) => {
        const parent = nodes.find((n) => n.id === node.parentId)
        if (!parent) return null

        const x1 = (parent.x * window.innerWidth) / 100
        const y1 = (parent.y * window.innerHeight) / 100
        const x2 = (node.x * window.innerWidth) / 100
        const y2 = (node.y * window.innerHeight) / 100

        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2

        const colorData = NODE_COLORS.find((c) => node.color.includes(c.light.split(" ")[0].replace("border-", "")))
        const strokeColor = isDarkMode
          ? colorData?.darkConnection || CENTER_COLOR.darkConnection
          : colorData?.connection || CENTER_COLOR.connection

        return (
          <g key={`connection-${node.id}`}>
            <path
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              stroke={strokeColor}
              strokeWidth="2"
              fill="none"
              className="transition-all duration-300"
            />
          </g>
        )
      })}
    </svg>
  )
}
