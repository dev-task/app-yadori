import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  interactive = false,
  padding = 'md'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const baseClasses = `bg-spotify-gray-800 rounded-2xl shadow-spotify-lg border border-spotify-gray-700 transition-all duration-300 ${paddingClasses[padding]}`
  const interactiveClasses = interactive 
    ? 'hover:shadow-spotify-xl hover:bg-spotify-gray-700 hover:border-spotify-gray-600 cursor-pointer transform hover:scale-105 active:scale-95' 
    : ''

  return (
    <div className={`${baseClasses} ${interactiveClasses} ${className}`}>
      {children}
    </div>
  )
}