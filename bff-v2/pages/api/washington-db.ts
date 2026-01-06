import { NextApiRequest, NextApiResponse } from 'next';
import { washingtonDB } from '../../lib/washington-cannabis-db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      action, 
      searchCriteria, 
      userPreferences, 
      productId 
    } = req.body;

    switch (action) {
      case 'search':
        const searchResults = washingtonDB.searchProducts(searchCriteria);
        return res.status(200).json({
          success: true,
          products: searchResults,
          count: searchResults.length
        });

      case 'recommend':
        const recommendations = washingtonDB.getRecommendations(userPreferences);
        return res.status(200).json({
          success: true,
          recommendations,
          count: recommendations.length,
          message: `Found ${recommendations.length} personalized recommendations from Washington state licensed products`
        });

      case 'product':
        const product = washingtonDB.getProductById(productId);
        return res.status(200).json({
          success: true,
          product: product || null
        });

      case 'stats':
        const stats = washingtonDB.getStats();
        return res.status(200).json({
          success: true,
          stats
        });

      case 'brands':
        const brands = washingtonDB.getBrands();
        return res.status(200).json({
          success: true,
          brands
        });

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: search, recommend, product, stats, or brands' 
        });
    }

  } catch (error) {
    console.error('Washington DB API error:', error);
    return res.status(500).json({ 
      error: 'Database query failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error)?.message : undefined
    });
  }
}