import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const variantClasses = {
    default: 'bg-spotify-gray-700 text-spotify-gray-300',
    success: 'bg-spotify-green-500 bg-opacity-20 text-spotify-green-400 border border-spotify-green-500 border-opacity-30',
    warning: 'bg-spotify-yellow-500 bg-opacity-20 text-spotify-yellow-400 border border-spotify-yellow-500 border-opacity-30',
    error: 'bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30',
    info: 'bg-spotify-blue-500 bg-opacity-20 text-spotify-blue-400 border border-spotify-blue-500 border-opacity-30'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  )
}