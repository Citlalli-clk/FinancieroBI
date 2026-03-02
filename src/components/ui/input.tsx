import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-clk-gray-light bg-white px-3 py-2 text-sm text-clk-text placeholder:text-clk-gray-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clk-red/50 focus-visible:border-clk-red disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
