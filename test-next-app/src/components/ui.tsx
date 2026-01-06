import React from 'react'

// Card Component
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      {children}
    </div>
  )
}

// Title Component
export function Title({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-medium text-gray-900 mb-4 ${className}`}>
      {children}
    </h3>
  )
}

// Text Component
export function Text({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-gray-600 ${className}`}>
      {children}
    </p>
  )
}

// Metric Component
export function Metric({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-2xl font-bold text-gray-900 ${className}`}>
      {children}
    </div>
  )
}

// Button Component
export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  [key: string]: any
}) {
  const baseClasses = 'inline-flex items-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    outline: 'text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 focus:ring-blue-500',
    secondary: 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Grid Component
export function Grid({ 
  children, 
  numItemsSm = 1, 
  numItemsLg = 3, 
  className = '' 
}: { 
  children: React.ReactNode
  numItemsSm?: number
  numItemsLg?: number
  className?: string 
}) {
  const smClasses = `grid-cols-${numItemsSm}`
  const lgClasses = `lg:grid-cols-${numItemsLg}`
  
  return (
    <div className={`grid ${smClasses} ${lgClasses} gap-6 ${className}`}>
      {children}
    </div>
  )
}

// Chart Components (Simplified - you may want to add recharts later)
export function LineChart({ 
  data, 
  index, 
  categories, 
  colors = ['blue'],
  yAxisWidth = 48
}: {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  yAxisWidth?: number
}) {
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-gray-400 mb-2">📊</div>
        <p className="text-sm text-gray-600">Line Chart</p>
        <p className="text-xs text-gray-500">{data.length} data points</p>
      </div>
    </div>
  )
}

export function BarChart({ 
  data, 
  index, 
  categories, 
  colors = ['blue'],
  yAxisWidth = 48
}: {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  yAxisWidth?: number
}) {
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-gray-400 mb-2">📊</div>
        <p className="text-sm text-gray-600">Bar Chart</p>
        <p className="text-xs text-gray-500">{data.length} data points</p>
      </div>
    </div>
  )
}

export function DonutChart({ 
  data, 
  index, 
  category, 
  colors = ['blue']
}: {
  data: any[]
  index: string
  category: string
  colors?: string[]
}) {
  return (
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-gray-400 mb-2">🍩</div>
        <p className="text-sm text-gray-600">Donut Chart</p>
        <p className="text-xs text-gray-500">{data.length} segments</p>
      </div>
    </div>
  )
} 