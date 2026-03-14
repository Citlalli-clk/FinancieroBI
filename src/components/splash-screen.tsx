"use client"

import { useState, useEffect } from "react"

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const [isRemoved, setIsRemoved] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState(1)
  const [logoVisible, setLogoVisible] = useState(false)

  useEffect(() => {
    // Fade in logo on mount
    const logoTimer = setTimeout(() => {
      setLogoVisible(true)
    }, 50)

    // Animate progress from 0 to 100 over 1.5 seconds
    const startTime = Date.now()
    const duration = 1500

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const rawProgress = Math.min(elapsed / duration, 1)
      // Ease-in-out function
      const eased = rawProgress < 0.5
        ? 2 * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2
      setProgress(Math.round(eased * 100))

      if (elapsed >= duration) {
        clearInterval(progressInterval)
        setProgress(100)
      }
    }, 16)

    // Animate dots (1 → 2 → 3 cycling)
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev % 3) + 1)
    }, 400)

    // Start fade out after 1.5 seconds (when progress reaches 100%)
    const fadeTimer = setTimeout(() => {
      setIsFading(true)
    }, 1500)

    // Remove from DOM after fade completes (1.5s + 300ms)
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      setIsRemoved(true)
    }, 1800)

    return () => {
      clearTimeout(logoTimer)
      clearInterval(progressInterval)
      clearInterval(dotsInterval)
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  const dotString = ".".repeat(dots)

  return (
    <>
      {!isRemoved && isVisible && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Click SEGUROS logo */}
          <div
            className={`mb-4 text-center transition-opacity duration-500 ${
              logoVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="text-4xl font-bold tracking-wide">
              <span className="text-[#E62800]">C</span>
              <span className="text-[#041224]">lick</span>
            </div>
            <div className="text-2xl font-bold tracking-[0.3em] text-[#E62800]">
              SEGUROS
            </div>
          </div>

          {/* C Logosymbol (smaller, as mascot placeholder) */}
          <div className="mb-8">
            <svg
              width="80"
              height="80"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Top half of C - Red */}
              <path
                d="M60 10C32.4 10 10 32.4 10 60H20C20 37.9 37.9 20 60 20C71.5 20 81.8 24.7 89.1 32.1L96.2 25C87.1 15.8 74.2 10 60 10Z"
                fill="#E62800"
              />
              {/* Bottom half of C - Navy */}
              <path
                d="M60 110C87.6 110 110 87.6 110 60H100C100 82.1 82.1 100 60 100C48.5 100 38.2 95.3 30.9 87.9L23.8 95C32.9 104.2 45.8 110 60 110Z"
                fill="#041224"
              />
              {/* Left side of C - connects both halves */}
              <path
                d="M10 60C10 87.6 32.4 110 60 110L60 100C37.9 100 20 82.1 20 60H10Z"
                fill="#E62800"
              />
              <path
                d="M110 60C110 32.4 87.6 10 60 10L60 20C82.1 20 100 37.9 100 60H110Z"
                fill="#041224"
              />
            </svg>
          </div>

          {/* Progress bar section */}
          <div className="w-64 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6B7280]">Progreso</span>
              <span className="text-sm text-[#6B7280] font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#E5E7E9] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#E62800] transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Loading text with animated dots */}
          <div className="text-sm text-[#6B7280] mb-1">
            Cargando información<span className="inline-block w-6 text-left">{dotString}</span>
          </div>

          {/* Secondary text */}
          <div className="text-xs text-[#9CA3AF] italic">
            Por favor espera un momento
          </div>
        </div>
      )}

      {children}
    </>
  )
}
