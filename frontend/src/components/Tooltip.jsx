import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export default function Tooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 200,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const containerRef = useRef(null)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      updatePosition()
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // Default to top
    let top = rect.top - 8 // 8px offset
    let left = rect.left + rect.width / 2

    if (position === 'bottom') {
      top = rect.bottom + 8
    } else if (position === 'left') {
      top = rect.top + rect.height / 2
      left = rect.left - 8
    } else if (position === 'right') {
      top = rect.top + rect.height / 2
      left = rect.right + 8
    }

    setCoords({ top, left })
  }

  // Close tooltip on scroll or resize to avoid detachment
  useEffect(() => {
    if (isVisible) {
      const handleScroll = () => setIsVisible(false)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleScroll)
      }
    }
  }, [isVisible])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  if (!content) return children

  const tooltipElement = (
    <div
      role="tooltip"
      className={clsx(
        "fixed z-[100] px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900/90 dark:bg-slate-100/90 dark:text-slate-900 rounded-lg shadow-xl backdrop-blur-md transition-all duration-200 pointer-events-none tracking-wide",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        position === 'top' && "-translate-x-1/2 -translate-y-full",
        position === 'bottom' && "-translate-x-1/2",
        position === 'left' && "-translate-x-full -translate-y-1/2",
        position === 'right' && "-translate-y-1/2",
        className
      )}
      style={{ top: coords.top, left: coords.left }}
    >
      {content}
    </div>
  )

  return (
    <>
      <div 
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex w-fit h-fit"
      >
        {children}
      </div>
      {createPortal(tooltipElement, document.body)}
    </>
  )
}
