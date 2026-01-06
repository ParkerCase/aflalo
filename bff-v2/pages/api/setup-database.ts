// Simple API endpoint to create all BFF database tables
// Visit /api/setup-database to run this once

import { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'

const CREATE_TABLES_SQL = `
-- Users table for PIN-based anonymous profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin VARCHAR(5) UNIQUE NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_universal BOOLEAN DEFAULT FALSE,
  location VARCHAR(255)
);

-- Strains table for cannabis strain data
CREATE TABLE IF NOT EXISTS strains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('indica', 'sativa', 'hybrid')),
  thc_min DECIMAL(5,2) DEFAULT 0,
  thc_max DECIMAL(5,2) DEFAULT 0,
  cbd_min DECIMAL(5,2) DEFAULT 0,
  cbd_max DECIMAL(5,2) DEFAULT 0,
  terpenes JSONB DEFAULT '{}',
  effects JSONB DEFAULT '[]',
  lineage JSONB DEFAULT '{}',
  description TEXT,
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations table for tracking suggestions
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strain_id UUID REFERENCES strains(id),
  confidence_score DECIMAL(3,2) NOT NULL,
  reasoning TEXT NOT NULL,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_data JSONB DEFAULT '{}'
);

-- Expert knowledge table for brother's cannabis expertise
CREATE TABLE IF NOT EXISTS expert_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL CHECK (category IN ('Customer Scenarios', 'Product Interactions', 'Strain Wisdom', 'Dosing/Timing', 'Troubleshooting')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags JSONB DEFAULT '[]'
);

-- User sessions table for daily questionnaires  
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood VARCHAR(50) NOT NULL,
  energy_level VARCHAR(20) NOT NULL,
  nutrition_status VARCHAR(50) NOT NULL,
  desired_effect VARCHAR(30) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  questionnaire_complete BOOLEAN DEFAULT TRUE
);

-- Feedback table for learning from user responses
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'detailed')),
  feedback_text TEXT,
  product_effectiveness VARCHAR(20) CHECK (product_effectiveness IN ('perfect', 'good', 'okay', 'not_right', 'too_strong', 'too_weak')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Washington State products table for licensed inventory
CREATE TABLE IF NOT EXISTS washington_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  flavor VARCHAR(255),
  cannabinoids JSONB NOT NULL,
  total_cannabinoids DECIMAL(8,2),
  servings INTEGER,
  per_serving JSONB,
  profile VARCHAR(50),
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'approved',
  license_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin);
CREATE INDEX IF NOT EXISTS idx_strains_name ON strains(name);
CREATE INDEX IF NOT EXISTS idx_strains_type ON strains(type);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_knowledge_category ON expert_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_recommendation_id ON feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_washington_products_brand ON washington_products(brand);
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed - use POST to create tables' })
  }

  if (!process.env.XATA_DATABASE_URL) {
    return res.status(500).json({ error: 'XATA_DATABASE_URL environment variable is required' })
  }

  const pool = new Pool({
    connectionString: process.env.XATA_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log('Database connected:', testResult.rows[0].current_time)

    // Create all tables
    await pool.query(CREATE_TABLES_SQL)
    console.log('Tables created successfully')

    // Verify tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'strains', 'recommendations', 'expert_knowledge', 'user_sessions', 'feedback', 'washington_products')
    `)
    
    const tablesCreated = tablesResult.rows.map(row => row.table_name)

    // Seed with Washington State sample data
    const sampleProducts = [
      {
        brand: 'Georgetown Bottling',
        product_name: 'Cormorant Gummies',
        flavor: 'Strawberry Kiwi 1:1',
        cannabinoids: { THC: 100, CBD: 100 },
        total_cannabinoids: 200,
        servings: 10,
        per_serving: { THC: 10, CBD: 10 },
        profile: 'Balanced THC:CBD',
        category: 'General Use',
        license_number: 355387
      },
      {
        brand: 'NCMX LLC', 
        product_name: 'WYLD Gummy',
        flavor: 'Kiwi',
        cannabinoids: { THC: 50, THCV: 50 },
        total_cannabinoids: 100,
        servings: 10,
        per_serving: { THC: 5, THCV: 5 },
        profile: 'THC-Dominant',
        category: 'General Use',
        license_number: 416278
      }
    ]

    let productsAdded = 0
    for (const product of sampleProducts) {
      try {
        await pool.query(`
          INSERT INTO washington_products (brand, product_name, flavor, cannabinoids, total_cannabinoids, servings, per_serving, profile, category, license_number)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          product.brand,
          product.product_name,
          product.flavor,
          JSON.stringify(product.cannabinoids),
          product.total_cannabinoids,
          product.servings,
          JSON.stringify(product.per_serving),
          product.profile,
          product.category,
          product.license_number
        ])
        productsAdded++
      } catch (seedError) {
        console.log('Product already exists:', product.product_name)
      }
    }

    await pool.end()

    return res.status(200).json({
      success: true,
      message: 'BFF database setup completed successfully',
      tablesCreated,
      productsAdded,
      nextSteps: [
        'All database tables created',
        `${productsAdded} Washington State products added`,
        'Ready for user registration',
        'Ready for expert knowledge input',
        'Chat system ready to use database'
      ]
    })

  } catch (error) {
    console.error('Database setup error:', error)
    await pool.end()
    
    return res.status(500).json({
      success: false,
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Check XATA_DATABASE_URL is correct',
        'Verify database exists in Xata dashboard',
        'Ensure PostgreSQL connection is active'
      ]
    })
  }
}