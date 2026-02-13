import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  glowColor?: 'cyan' | 'pink' | 'emerald' | 'purple' | 'amber'
}

const glowColorMap = {
  cyan: 'border-cyan-500/30 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20',
  pink: 'border-pink-500/30 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20',
  emerald: 'border-emerald-500/30 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20',
  purple: 'border-purple-500/30 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20',
  amber: 'border-amber-500/30 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20'
}

export const Card: React.FC<CardProps> = ({ children, className, glowColor = 'cyan' }) => {
  return (
    <div
      className={clsx(
        'bg-slate-900/50 backdrop-blur-sm border rounded-lg p-6 transition-all duration-300 hover:scale-105',
        glowColorMap[glowColor],
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
