import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  maxLength?: number
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  maxLength,
  className = '',
  value,
  ...props
}) => {
  const textareaClasses = `textarea-field ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`
  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-spotify-gray-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        className={textareaClasses}
        value={value}
        {...props}
      />
      
      <div className="flex items-center justify-between">
        <div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          
          {helperText && !error && (
            <p className="text-spotify-gray-500 text-sm">{helperText}</p>
          )}
        </div>
        
        {maxLength && (
          <p className={`text-sm ${currentLength > maxLength ? 'text-red-400' : 'text-spotify-gray-500'}`}>
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}