// Real Xata Database Implementation for BFF
// Replaces mock database.ts with actual functionality

import { Pool } from 'pg'

// Interfaces matching PDF specification
export interface User {
  id: string
  pin: string
  preferences: Record<string, any>
  created_at: Date
  updated_at: Date
  is_universal: boolean
  location?: string
}

export interface ExpertKnowledge {
  id: string
  category: 'Customer Scenarios' | 'Product Interactions' | 'Strain Wisdom' | 'Dosing/Timing' | 'Troubleshooting'
  question: string
  answer: string
  priority: number
  created_at: Date
  tags?: string[]
}

export interface UserSession {
  id: string
  user_id: string
  mood: string
  energy_level: string
  nutrition_status: string
  desired_effect: string
  timestamp: Date
  questionnaire_complete: boolean
}

export interface Recommendation {
  id: string
  user_id: string
  strain_id: string
  confidence_score: number
  reasoning: string
  feedback_rating?: number
  created_at: Date
  session_data: Record<string, any>
}

export interface Strain {
  id: string
  name: string
  type: 'indica' | 'sativa' | 'hybrid'
  thc_min: number
  thc_max: number
  cbd_min: number
  cbd_max: number
  terpenes: Record<string, any>
  effects: string[]
  lineage: Record<string, any>
  description?: string
  source: string
}

export interface WashingtonProduct {
  id: string
  brand: string
  product_name: string
  flavor?: string
  cannabinoids: Record<string, number>
  total_cannabinoids: number
  servings?: number
  per_serving?: Record<string, number>
  profile: string
  category: string
  status: string
  license_number: number
}

// Database connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    if (!process.env.XATA_DATABASE_URL) {
      throw new Error('XATA_DATABASE_URL environment variable is required')
    }
    
    pool = new Pool({
      connectionString: process.env.XATA_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

// Real Database Operations
export class Database {
  // Test database connection
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const db = getPool()
      const result = await db.query('SELECT NOW() as current_time')
      return {
        success: true,
        message: `Database connected. Time: ${result.rows[0].current_time}`
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${(error as Error).message}`
      }
    }
  }

  // Users - PIN-based anonymous profiles
  static async createUser(userData: { pin: string; preferences?: Record<string, any>; is_universal?: boolean; location?: string }): Promise<User> {
    const db = getPool()
    const result = await db.query(
      `INSERT INTO users (pin, preferences, is_universal, location) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userData.pin, JSON.stringify(userData.preferences || {}), userData.is_universal || false, userData.location]
    )
    return result.rows[0]
  }

  static async getUserByPin(pin: string): Promise<User | null> {
    const db = getPool()
    const result = await db.query('SELECT * FROM users WHERE pin = $1', [pin])
    return result.rows[0] || null
  }

  static async updateUser(pin: string, updates: Partial<User>): Promise<User | null> {
    const db = getPool()
    const result = await db.query(
      `UPDATE users 
       SET preferences = COALESCE($1, preferences), 
           is_universal = COALESCE($2, is_universal),
           location = COALESCE($3, location),
           updated_at = CURRENT_TIMESTAMP
       WHERE pin = $4 
       RETURNING *`,
      [updates.preferences ? JSON.stringify(updates.preferences) : null, updates.is_universal, updates.location, pin]
    )
    return result.rows[0] || null
  }

  // Expert Knowledge - Your brother's cannabis expertise
  static async saveExpertKnowledge(knowledge: Omit<ExpertKnowledge, 'id' | 'created_at'>): Promise<{ success: boolean; id: string }> {
    const db = getPool()
    const result = await db.query(
      `INSERT INTO expert_knowledge (category, question, answer, priority, tags) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id`,
      [knowledge.category, knowledge.question, knowledge.answer, knowledge.priority, JSON.stringify(knowledge.tags || [])]
    )
    return { success: true, id: result.rows[0].id }
  }

  static async getExpertKnowledge(category?: string): Promise<ExpertKnowledge[]> {
    const db = getPool()
    const query = category 
      ? 'SELECT * FROM expert_knowledge WHERE category = $1 ORDER BY priority DESC, created_at DESC'
      : 'SELECT * FROM expert_knowledge ORDER BY priority DESC, created_at DESC'
    const values = category ? [category] : []
    
    const result = await db.query(query, values)
    return result.rows
  }

  // User Sessions - Daily questionnaires
  static async createSession(sessionData: Omit<UserSession, 'id' | 'timestamp'>): Promise<UserSession> {
    const db = getPool()
    const result = await db.query(
      `INSERT INTO user_sessions (user_id, mood, energy_level, nutrition_status, desired_effect, questionnaire_complete) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [sessionData.user_id, sessionData.mood, sessionData.energy_level, sessionData.nutrition_status, sessionData.desired_effect, sessionData.questionnaire_complete]
    )
    return result.rows[0]
  }

  static async getLatestSession(userId: string): Promise<UserSession | null> {
    const db = getPool()
    const result = await db.query(
      'SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [userId]
    )
    return result.rows[0] || null
  }

  // Recommendations - Track what was suggested
  static async createRecommendation(recData: Omit<Recommendation, 'id' | 'created_at'>): Promise<Recommendation> {
    const db = getPool()
    const result = await db.query(
      `INSERT INTO recommendations (user_id, strain_id, confidence_score, reasoning, session_data) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [recData.user_id, recData.strain_id, recData.confidence_score, recData.reasoning, JSON.stringify(recData.session_data)]
    )
    return result.rows[0]
  }

  static async getUserRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
    const db = getPool()
    const result = await db.query(
      'SELECT * FROM recommendations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    )
    return result.rows
  }

  // Strains - Cannabis strain database
  static async addStrain(strainData: Omit<Strain, 'id'>): Promise<Strain> {
    const db = getPool()
    const result = await db.query(
      `INSERT INTO strains (name, type, thc_min, thc_max, cbd_min, cbd_max, terpenes, effects, lineage, description, source) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [strainData.name, strainData.type, strainData.thc_min, strainData.thc_max, strainData.cbd_min, strainData.cbd_max, 
       JSON.stringify(strainData.terpenes), JSON.stringify(strainData.effects), JSON.stringify(strainData.lineage), 
       strainData.description, strainData.source]
    )
    return result.rows[0]
  }

  static async searchStrains(criteria: { type?: string; effects?: string[]; maxTHC?: number; minCBD?: number }): Promise<Strain[]> {
    const db = getPool()
    let query = 'SELECT * FROM strains WHERE 1=1'
    const values: any[] = []
    let paramCount = 0

    if (criteria.type) {
      paramCount++
      query += ` AND type = $${paramCount}`
      values.push(criteria.type)
    }

    if (criteria.maxTHC) {
      paramCount++
      query += ` AND thc_max <= $${paramCount}`
      values.push(criteria.maxTHC)
    }

    if (criteria.minCBD) {
      paramCount++
      query += ` AND cbd_min >= $${paramCount}`
      values.push(criteria.minCBD)
    }

    query += ' ORDER BY name'
    
    const result = await db.query(query, values)
    return result.rows
  }

  // Washington Products - Licensed inventory
  static async getWashingtonProducts(filters?: { profile?: string; maxTHC?: number; category?: string }): Promise<WashingtonProduct[]> {
    const db = getPool()
    let query = 'SELECT * FROM washington_products WHERE 1=1'
    const values: any[] = []
    let paramCount = 0

    if (filters?.profile) {
      paramCount++
      query += ` AND profile = $${paramCount}`
      values.push(filters.profile)
    }

    if (filters?.maxTHC) {
      paramCount++
      query += ` AND (per_serving->>'THC')::float <= $${paramCount}`
      values.push(filters.maxTHC)
    }

    if (filters?.category) {
      paramCount++
      query += ` AND category = $${paramCount}`
      values.push(filters.category)
    }

    query += ' ORDER BY brand, product_name'
    
    const result = await db.query(query, values)
    return result.rows
  }

  // Feedback - Learning from user responses
  static async saveFeedback(feedbackData: { 
    user_id: string; 
    recommendation_id: string; 
    rating: number; 
    feedback_type: string; 
    feedback_text?: string; 
    product_effectiveness?: string 
  }): Promise<{ success: boolean; id: string }> {
    const db = getPool()
    const result = await db.query(
      `INSERT INTO feedback (user_id, recommendation_id, rating, feedback_type, feedback_text, product_effectiveness) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [feedbackData.user_id, feedbackData.recommendation_id, feedbackData.rating, 
       feedbackData.feedback_type, feedbackData.feedback_text, feedbackData.product_effectiveness]
    )
    return { success: true, id: result.rows[0].id }
  }

  static async getFeedbackStats(): Promise<{ totalFeedback: number; averageRating: number; effectivenessBreakdown: Record<string, number> }> {
    const db = getPool()
    
    const totalResult = await db.query('SELECT COUNT(*) as count FROM feedback')
    const avgResult = await db.query('SELECT AVG(rating) as avg_rating FROM feedback WHERE rating IS NOT NULL')
    const effectivenessResult = await db.query(
      `SELECT product_effectiveness, COUNT(*) as count 
       FROM feedback 
       WHERE product_effectiveness IS NOT NULL 
       GROUP BY product_effectiveness`
    )

    const effectivenessBreakdown: Record<string, number> = {}
    effectivenessResult.rows.forEach(row => {
      effectivenessBreakdown[row.product_effectiveness] = parseInt(row.count)
    })

    return {
      totalFeedback: parseInt(totalResult.rows[0].count),
      averageRating: parseFloat(avgResult.rows[0].avg_rating) || 0,
      effectivenessBreakdown
    }
  }

  // Database statistics
  static async getStats(): Promise<{ 
    totalUsers: number; 
    totalSessions: number; 
    totalRecommendations: number; 
    totalExpertRules: number; 
    washingtonProducts: number 
  }> {
    const db = getPool()
    
    const [users, sessions, recommendations, expertRules, waProducts] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM user_sessions'),
      db.query('SELECT COUNT(*) as count FROM recommendations'),
      db.query('SELECT COUNT(*) as count FROM expert_knowledge'),
      db.query('SELECT COUNT(*) as count FROM washington_products')
    ])

    return {
      totalUsers: parseInt(users.rows[0].count),
      totalSessions: parseInt(sessions.rows[0].count), 
      totalRecommendations: parseInt(recommendations.rows[0].count),
      totalExpertRules: parseInt(expertRules.rows[0].count),
      washingtonProducts: parseInt(waProducts.rows[0].count)
    }
  }

  // Generic query method for health checks and maintenance
  static async query(sql: string, params: any[] = []): Promise<{ records: any[] }> {
    const db = getPool()
    const result = await db.query(sql, params)
    return { records: result.rows }
  }

  // Privacy and maintenance methods
  static async getUserSessions(userId: string): Promise<UserSession[]> {
    const db = getPool()
    const result = await db.query(
      'SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    )
    return result.rows
  }

  static async getUserFeedback(userId: string): Promise<any[]> {
    const db = getPool()
    const result = await db.query(
      'SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.rows
  }

  static async deleteFeedbackByUserId(userId: string): Promise<void> {
    const db = getPool()
    await db.query('DELETE FROM feedback WHERE user_id = $1', [userId])
  }

  static async deleteSessionsByUserId(userId: string): Promise<void> {
    const db = getPool()
    await db.query('DELETE FROM user_sessions WHERE user_id = $1', [userId])
  }

  static async deleteUser(userId: string): Promise<void> {
    const db = getPool()
    await db.query('DELETE FROM users WHERE id = $1', [userId])
  }
}

// Database class already exported above
