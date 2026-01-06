import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(dateObj)
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`
    }
  }

  return 'just now'
}

export function formatDeadline(deadline: string | Date): {
  formatted: string
  isUrgent: boolean
  daysLeft: number
} {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
  const now = new Date()
  const diffInMs = deadlineDate.getTime() - now.getTime()
  const daysLeft = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))

  return {
    formatted: formatDate(deadlineDate),
    isUrgent: daysLeft <= 7 && daysLeft > 0,
    daysLeft
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function extractNAICSCodes(text: string): number[] {
  // Match 6-digit NAICS codes
  const naicsRegex = /\b\d{6}\b/g
  const matches = text.match(naicsRegex)
  
  if (!matches) return []
  
  return [...new Set(matches.map(Number))].filter(code => 
    code >= 111110 && code <= 999999 // Valid NAICS range
  )
}

export function extractContractValue(text: string): {
  min?: number
  max?: number
} {
  // Remove commas and extract numbers with dollar signs or currency words
  const cleanText = text.replace(/,/g, '')
  
  // Patterns for currency values
  const patterns = [
    /\$\s*(\d+(?:\.\d{2})?)\s*(?:million|mil|m)/gi,
    /\$\s*(\d+(?:\.\d{2})?)\s*(?:billion|bil|b)/gi,
    /\$\s*(\d+(?:\.\d{2})?)\s*(?:thousand|k)/gi,
    /\$\s*(\d+(?:\.\d{2})?)/g
  ]

  const values: number[] = []

  patterns.forEach((pattern, index) => {
    const matches = cleanText.matchAll(pattern)
    for (const match of matches) {
      const value = parseFloat(match[1])
      if (value > 0) {
        switch (index) {
          case 0: // million
            values.push(value * 1000000)
            break
          case 1: // billion
            values.push(value * 1000000000)
            break
          case 2: // thousand
            values.push(value * 1000)
            break
          default: // regular dollar amount
            values.push(value)
        }
      }
    }
  })

  if (values.length === 0) return {}
  if (values.length === 1) return { min: values[0], max: values[0] }

  values.sort((a, b) => a - b)
  return { min: values[0], max: values[values.length - 1] }
}

export function extractDeadlines(text: string): Date[] {
  const datePatterns = [
    // MM/DD/YYYY
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
    // Month DD, YYYY
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    // DD Month YYYY
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
    // YYYY-MM-DD
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g
  ]

  const dates: Date[] = []

  datePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      try {
        let date: Date
        
        if (pattern.source.includes('January|February')) {
          // Month DD, YYYY format
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December']
          const monthIndex = monthNames.indexOf(match[1])
          date = new Date(parseInt(match[3]), monthIndex, parseInt(match[2]))
        } else if (pattern.source.includes('\\d{4}-')) {
          // YYYY-MM-DD format
          date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
        } else {
          // MM/DD/YYYY format
          date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]))
        }

        if (!isNaN(date.getTime()) && date > new Date()) {
          dates.push(date)
        }
      } catch (error) {
        // Skip invalid dates
      }
    }
  })

  return dates.sort((a, b) => a.getTime() - b.getTime())
}

export function calculateMatchScore(
  companyNAICS: number[],
  opportunityNAICS: number[],
  companyCertifications: string[],
  requiredCertifications: string[],
  companySize: string,
  setAsideType?: string
): number {
  let score = 0

  // NAICS match (40% weight)
  const naicsMatch = companyNAICS.some(code => opportunityNAICS.includes(code))
  if (naicsMatch) {
    score += 40
  } else {
    // Partial match for similar NAICS (first 4 digits)
    const partialMatch = companyNAICS.some(companyCode =>
      opportunityNAICS.some(oppCode =>
        Math.floor(companyCode / 100) === Math.floor(oppCode / 100)
      )
    )
    if (partialMatch) score += 20
  }

  // Certification match (25% weight)
  const certMatch = requiredCertifications.length === 0 ||
    requiredCertifications.some(cert =>
      companyCertifications.some(companyCert =>
        companyCert.toLowerCase().includes(cert.toLowerCase())
      )
    )
  if (certMatch) score += 25

  // Size standard match (25% weight)
  if (setAsideType) {
    const sizeMatch = checkSizeEligibility(companySize, setAsideType)
    if (sizeMatch) score += 25
  } else {
    // No set-aside, all sizes eligible
    score += 25
  }

  // Base eligibility (10% weight)
  score += 10

  return Math.min(score, 100)
}

export function checkSizeEligibility(companySize: string, setAsideType: string): boolean {
  const smallBusinessTypes = [
    'small_business',
    '8a',
    'hubzone',
    'sdvosb',
    'vosb',
    'wosb',
    'edwosb'
  ]

  if (smallBusinessTypes.includes(setAsideType.toLowerCase())) {
    return companySize.toLowerCase() === 'small'
  }

  return true // No size restriction for full and open competition
}

export function generateApplicationId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `APP-${timestamp}-${random}`.toUpperCase()
}

export function calculateWinProbability(
  matchScore: number,
  pastPerformanceRelevance: number,
  competitorCount: number,
  companyCapabilities: string[],
  requiredCapabilities: string[]
): number {
  let probability = 0

  // Base probability from match score (40% weight)
  probability += (matchScore / 100) * 40

  // Past performance relevance (30% weight)
  probability += (pastPerformanceRelevance / 100) * 30

  // Competition factor (20% weight)
  const competitionScore = Math.max(0, 100 - (competitorCount * 5))
  probability += (competitionScore / 100) * 20

  // Capability match (10% weight)
  const capabilityMatch = requiredCapabilities.length === 0 ? 100 :
    (requiredCapabilities.filter(req =>
      companyCapabilities.some(cap =>
        cap.toLowerCase().includes(req.toLowerCase())
      )
    ).length / requiredCapabilities.length) * 100

  probability += (capabilityMatch / 100) * 10

  return Math.min(Math.max(probability, 5), 95) // Keep between 5-95%
}

export function getSubscriptionLimits(tier: string): {
  maxUsers: number
  allowedJurisdictions: string[]
  maxApplicationsPerMonth: number
  aiCreditsPerMonth: number
  features: string[]
} {
  const limits = {
    starter: {
      maxUsers: 1,
      allowedJurisdictions: ['federal'],
      maxApplicationsPerMonth: 10,
      aiCreditsPerMonth: 100,
      features: ['Basic AI Analysis', 'Federal Opportunities', 'Email Support']
    },
    professional: {
      maxUsers: 5,
      allowedJurisdictions: ['federal', 'state'],
      maxApplicationsPerMonth: -1, // unlimited
      aiCreditsPerMonth: 500,
      features: ['Advanced AI Analysis', 'Federal + State Opportunities', 'Priority Support', 'Win Probability Scoring']
    },
    enterprise: {
      maxUsers: 25,
      allowedJurisdictions: ['federal', 'state', 'local'],
      maxApplicationsPerMonth: -1, // unlimited
      aiCreditsPerMonth: 2000,
      features: ['Premium AI Analysis', 'All Jurisdictions', 'Dedicated Support', 'API Access', 'Advanced Analytics']
    },
    custom: {
      maxUsers: -1, // unlimited
      allowedJurisdictions: ['federal', 'state', 'local'],
      maxApplicationsPerMonth: -1, // unlimited
      aiCreditsPerMonth: -1, // unlimited
      features: ['Enterprise Plus', 'Custom Integrations', 'Dedicated Account Manager']
    }
  }

  return limits[tier as keyof typeof limits] || limits.starter
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100) // Limit length
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function isValidFileType(fileName: string, allowedTypes: string[]): boolean {
  const extension = getFileExtension(fileName)
  return allowedTypes.includes(extension)
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

export function generatePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + special
  let password = ''
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim())
      rows.push(currentRow)
      currentRow = []
      currentCell = ''
    } else if (char !== '\r') {
      currentCell += char
    }
  }
  
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    rows.push(currentRow)
  }
  
  return rows
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        const stringValue = value?.toString() || ''
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '??'
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    
    const attempt = async () => {
      try {
        attempts++
        const result = await fn()
        resolve(result)
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error)
        } else {
          setTimeout(attempt, delay * attempts)
        }
      }
    }
    
    attempt()
  })
}
