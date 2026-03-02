"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indicatorClassName, ...props }, ref) => {
    const pct = Math.min((value / max) * 100, 100)
    return (
      <div
        ref={ref}
        className={cn("relative h-3 w-full overflow-hidden rounded-full bg-clk-gray-light", className)}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-clk-yellow" : "bg-clk-red",
            indicatorClassName
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
