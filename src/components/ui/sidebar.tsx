"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarVariants = cva(
  "fixed top-0 left-0 h-full bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-r z-50 transition-transform duration-300 ease-in-out",
  {
    variants: {
      state: {
        open: "translate-x-0",
        closed: "-translate-x-full",
      },
    },
    defaultVariants: {
      state: "closed",
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const handleToggle = () => {
      setIsOpen(!isOpen)
    }

    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={handleToggle}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">{isOpen ? "Cerrar menú" : "Abrir menú"}</span>
        </Button>
        <div
          ref={ref}
          className={cn(
            sidebarVariants({ state: isOpen ? "open" : "closed" }),
            "w-64 lg:translate-x-0 lg:mt-16 xl:mt-16 2xl:mt-16",
            className
          )}
          {...props}
        >
          <div className="flex h-full flex-col p-4 bg-[hsl(var(--sidebar-background))]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 lg:hidden"
              onClick={handleToggle}
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Cerrar menú</span>
            </Button>
            {children}
          </div>
        </div>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
            onClick={handleToggle}
          />
        )}
      </>
    )
  }
)

Sidebar.displayName = "Sidebar"

export { Sidebar }
