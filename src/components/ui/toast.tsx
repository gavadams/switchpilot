"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning"
  onClose?: () => void
  duration?: number
}

const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = "default",
  onClose,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300) // Wait for animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const variantStyles = {
    default: "bg-white border-neutral-200 text-neutral-900",
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900"
  }

  const iconStyles = {
    default: "text-neutral-600",
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600"
  }

  const icons = {
    default: "✓",
    success: "✓",
    error: "✗",
    warning: "⚠"
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-80 max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300",
        variantStyles[variant],
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 text-lg", iconStyles[variant])}>
          {icons[variant]}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-sm">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90 mt-1">{description}</div>
          )}
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Toast context and provider
interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export { Toast }
