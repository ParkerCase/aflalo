// Washington State Cannabis Database Service - SERVER SIDE ONLY
// This file should only be imported in API routes (pages/api/*)

import fs from 'fs';
import path from 'path';

// Washington State Cannabis Database Service
export interface WashingtonProduct {
  id: number;
  brand: string;
  productName: string;
  flavor?: string;
  cannabinoids: Record<string, number>;
  totalCannabinoids: number;
  servings?: number;
  perServing?: Record<string, number>;
  profile: 'THC-Dominant' | 'CBD-Dominant' | 'Balanced THC:CBD' | 'Other';
  category: 'General Use' | 'High CBD' | 'High THC';
  status: string;
  license: number;
}

export interface WashingtonDatabase {
  products: WashingtonProduct[];
  metadata: {
    totalProducts: number;
    brands: string[];
    cannabinoids: string[];
    profiles: string[];
    categories: string[];
    profileDistribution: Record<string, number>;
    lastUpdated: string;
    source: string;
    license: string;
  };
}

class WashingtonCannabisDB {
  private database: WashingtonDatabase | null = null;

  /**
   * Load the Washington State cannabis database - SERVER SIDE ONLY
   */
  private loadDatabase(): WashingtonDatabase {
    // Ensure we're running on the server side
    if (typeof window !== 'undefined') {
      throw new Error('Washington DB can only be accessed on the server side');
    }

    if (this.database) return this.database;

    try {
      const dbPath = path.join(process.cwd(), 'data', 'washington-cannabis-db.json');
      const data = fs.readFileSync(dbPath, 'utf8');
      this.database = JSON.parse(data);
      return this.database!;
    } catch (error) {
      console.error('Error loading Washington cannabis database:', error);
      
      // Fallback to sample data if file doesn't exist
      this.database = {
        products: [
          {
            id: 1,
            brand: "Georgetown Bottling",
            productName: "Cormorant Gummies",
            flavor: "Strawberry Kiwi 1:1",
            cannabinoids: { THC: 100, CBD: 100 },
            totalCannabinoids: 200,
            servings: 10,
            perServing: { THC: 10, CBD: 10 },
            profile: "Balanced THC:CBD",
            category: "General Use",
            status: "Approved",
            license: 355387
          },
          {
            id: 2,
            brand: "NCMX LLC",
            productName: "WYLD Gummy", 
            flavor: "Kiwi",
            cannabinoids: { THC: 50, THCV: 50 },
            totalCannabinoids: 100,
            servings: 10,
            perServing: { THC: 5, THCV: 5 },
            profile: "THC-Dominant",
            category: "General Use", 
            status: "Approved",
            license: 416278
          }
        ],
        metadata: {
          totalProducts: 2,
          brands: ["Georgetown Bottling", "NCMX LLC"],
          cannabinoids: ["THC", "CBD", "THCV", "CBG", "CBN", "CBDV", "THCA", "CBC"],
          profiles: ["THC-Dominant", "CBD-Dominant", "Balanced THC:CBD", "Other"],
          categories: ["General Use", "High CBD", "High THC"],
          profileDistribution: { "THC-Dominant": 1, "Balanced THC:CBD": 1 },
          lastUpdated: new Date().toISOString(),
          source: "Washington State DOH Cannabis Product Approvals",
          license: "Washington State Licensed Products Only"
        }
      };
      
      return this.database!;
    }
  }

  /**
   * Search products by various criteria for BFF recommendations
   */
  searchProducts(criteria: {
    profile?: string;
    minTHC?: number;
    maxTHC?: number;
    minCBD?: number;
    maxCBD?: number;
    productType?: string;
    brand?: string;
    category?: string;
    hasServingInfo?: boolean;
  }): WashingtonProduct[] {
    const db = this.loadDatabase();
    
    return db.products.filter(product => {
      // Profile filter (THC-Dominant, CBD-Dominant, etc.)
      if (criteria.profile && product.profile !== criteria.profile) {
        return false;
      }

      // THC range filters
      const productTHC = product.perServing?.THC || 0;
      if (criteria.minTHC && productTHC < criteria.minTHC) return false;
      if (criteria.maxTHC && productTHC > criteria.maxTHC) return false;

      // CBD range filters  
      const productCBD = product.perServing?.CBD || 0;
      if (criteria.minCBD && productCBD < criteria.minCBD) return false;
      if (criteria.maxCBD && productCBD > criteria.maxCBD) return false;

      // Product type filter
      if (criteria.productType && !product.productName.toLowerCase().includes(criteria.productType.toLowerCase())) {
        return false;
      }

      // Brand filter
      if (criteria.brand && product.brand !== criteria.brand) {
        return false;
      }

      // Category filter
      if (criteria.category && product.category !== criteria.category) {
        return false;
      }

      // Serving info filter
      if (criteria.hasServingInfo && !product.perServing) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get recommendations based on BFF questionnaire answers
   */
  getRecommendations(userPreferences: {
    feeling: 'energetic' | 'tired';
    mood: 'awesome' | 'so-so' | 'not-great';
    hydration: 'well-hydrated' | 'not-hydrated';
    hunger: 'full' | 'need-to-eat' | 'starving';
    goal: 'party' | 'active-focused' | 'relax-alert' | 'zone-out' | 'balanced';
    experience: 'beginner' | 'intermediate' | 'experienced';
    productPreference?: 'gummies' | 'beverages' | 'any';
  }): WashingtonProduct[] {
    const db = this.loadDatabase();

    // Determine ideal cannabinoid profile based on preferences
    let targetProfile: string;
    let maxTHCPerServing: number;

    // Goal-based profile selection
    if (userPreferences.goal === 'party' || userPreferences.goal === 'active-focused') {
      targetProfile = userPreferences.feeling === 'energetic' ? 'Balanced THC:CBD' : 'THC-Dominant';
    } else if (userPreferences.goal === 'relax-alert') {
      targetProfile = 'Balanced THC:CBD';
    } else if (userPreferences.goal === 'zone-out') {
      targetProfile = 'THC-Dominant';
    } else {
      targetProfile = 'Balanced THC:CBD';
    }

    // Experience-based THC limits
    if (userPreferences.experience === 'beginner') {
      maxTHCPerServing = 5; // 5mg or less per serving
    } else if (userPreferences.experience === 'intermediate') {
      maxTHCPerServing = 15;
    } else {
      maxTHCPerServing = 999; // No limit for experienced users
    }

    // Search for matching products
    const searchCriteria = {
      profile: targetProfile,
      maxTHC: maxTHCPerServing,
      hasServingInfo: true,
      ...(userPreferences.productPreference && userPreferences.productPreference !== 'any' 
        ? { productType: userPreferences.productPreference } 
        : {})
    };

    const recommendations = this.searchProducts(searchCriteria);

    // Sort by relevance (balanced products first, then by serving size)
    recommendations.sort((a, b) => {
      // Prefer products with clear serving info
      if (a.perServing && !b.perServing) return -1;
      if (!a.perServing && b.perServing) return 1;

      // For beginners, prefer lower THC
      if (userPreferences.experience === 'beginner') {
        const aTHC = a.perServing?.THC || 0;
        const bTHC = b.perServing?.THC || 0;
        return aTHC - bTHC;
      }

      // General sorting by total cannabinoids
      return b.totalCannabinoids - a.totalCannabinoids;
    });

    // Return top 10 recommendations
    return recommendations.slice(0, 10);
  }

  /**
   * Get product details by ID
   */
  getProductById(id: number): WashingtonProduct | null {
    const db = this.loadDatabase();
    return db.products.find(product => product.id === id) || null;
  }

  /**
   * Get database statistics
   */
  getStats() {
    const db = this.loadDatabase();
    return db.metadata;
  }

  /**
   * Get all unique brands
   */
  getBrands(): string[] {
    const db = this.loadDatabase();
    return db.metadata.brands;
  }
}

// Export singleton instance - SERVER SIDE ONLY
export const washingtonDB = new WashingtonCannabisDB();