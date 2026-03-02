import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-clk-red text-white",
        secondary: "border-transparent bg-clk-dark text-white",
        outline: "border-clk-gray-light text-clk-text",
        success: "border-transparent bg-green-100 text-green-700",
        warning: "border-transparent bg-clk-yellow/20 text-yellow-700",
        destructive: "border-transparent bg-red-100 text-clk-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
