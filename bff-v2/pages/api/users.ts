import type { NextApiRequest, NextApiResponse } from 'next'
import { CreateUserRequest, User } from '../../lib/types'
import { Database } from '../../lib/database'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { pin, preferences, is_universal, location }: CreateUserRequest = req.body

      // Validate PIN format (5 digits)
      if (!/^\d{5}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must be exactly 5 digits' })
      }

      // Create new user using Database class
      const newUser = await Database.createUser({
        pin,
        preferences,
        is_universal,
        location
      })

      res.status(201).json({ user: newUser })
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' })
    }
  } else if (req.method === 'GET') {
    try {
      const { pin } = req.query

      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({ error: 'PIN parameter is required' })
      }

      const user = await Database.getUserByPin(pin)
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.status(200).json({ user })
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve user' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { pin, preferences } = req.body

      if (!pin || typeof pin !== 'string') {
        return res.status(400).json({ error: 'PIN is required' })
      }

      // Update user preferences
      const updatedUser = await Database.updateUser(pin, { preferences })
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.status(200).json({ user: updatedUser })
    } catch (error) {
      console.error('Update user error:', error)
      res.status(500).json({ error: 'Failed to update user' })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET', 'PUT'])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
}
