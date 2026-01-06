import axios from 'axios'

// Standardized strain interface
export interface Strain {
  id: string
  name: string
  type: 'indica' | 'sativa' | 'hybrid'
  thc: number
  cbd: number
  effects: string[]
  flavors: string[]
  description: string
  source: string
}

// Cannabis API service
export class CannabisAPI {
  // Test all APIs
  static async testAPIs() {
    const results = {
      cannabisAPI: false,
      cannlyticsAPI: false,
      strainAPI: false,
      errors: [] as string[]
    }

    // Test Cannabis API (Piyush-Bhor)
    try {
      const response = await axios.get(`${process.env.CANNABIS_API_BASE}/api/strains/getAllStrains`, {
        timeout: 5000
      })
      results.cannabisAPI = response.status === 200
      console.log('✅ Cannabis API working:', response.data?.length || 0, 'strains')
    } catch (error) {
      results.errors.push(`Cannabis API failed: ${(error as Error).message}`)
      console.log('❌ Cannabis API failed')
    }

    // Test Cannlytics API
    try {
      const response = await axios.get(`${process.env.CANNLYTICS_API_BASE}/api/data/strains?limit=1`, {
        timeout: 5000
      })
      results.cannlyticsAPI = response.status === 200
      console.log('✅ Cannlytics API working')
    } catch (error) {
      results.errors.push(`Cannlytics API failed: ${(error as Error).message}`)
      console.log('❌ Cannlytics API failed')
    }

    // Test Strain API
    try {
      const response = await axios.get(`${process.env.STRAIN_API_BASE}/`, {
        timeout: 5000
      })
      results.strainAPI = response.status === 200
      console.log('✅ Strain API working')
    } catch (error) {
      results.errors.push(`Strain API failed: ${(error as Error).message}`)
      console.log('❌ Strain API failed')
    }

    return results
  }

  // Get strain by name (tries multiple APIs)
  static async getStrainByName(name: string): Promise<Strain | null> {
    // Try Cannabis API first
    try {
      const response = await axios.get(`${process.env.CANNABIS_API_BASE}/api/strains/getStrainsByName/${name}`)
      if (response.data && response.data.length > 0) {
        return this.normalizeStrainData(response.data[0], 'cannabis-api')
      }
    } catch (error) {
      console.log('Cannabis API failed for strain:', name)
    }

    // Try Cannlytics as backup
    try {
      const response = await axios.get(`${process.env.CANNLYTICS_API_BASE}/api/data/strains/${name}`)
      if (response.data) {
        return this.normalizeStrainData(response.data, 'cannlytics')
      }
    } catch (error) {
      console.log('Cannlytics failed for strain:', name)
    }

    return null
  }

  // Normalize different API responses to standard format
  private static normalizeStrainData(data: Record<string, unknown>, source: string): Strain {
    switch (source) {
      case 'cannabis-api':
        return {
          id: String(data._id || data.id || 'unknown'),
          name: String(data.strain || data.name || 'Unknown'),
          type: (String(data.type || 'hybrid')).toLowerCase() as 'indica' | 'sativa' | 'hybrid',
          thc: parseFloat(String(data.thc || '0')) || 0,
          cbd: parseFloat(String(data.cbd || '0')) || 0,
          effects: Array.isArray(data.effects) ? data.effects as string[] : [],
          flavors: Array.isArray(data.flavors) ? data.flavors as string[] : [],
          description: String(data.description || ''),
          source: 'Cannabis API'
        }
      
      case 'cannlytics':
        return {
          id: String(data.strain_name || 'unknown').replace(/\s+/g, '_'),
          name: String(data.strain_name || 'Unknown'),
          type: (String(data.strain_type || 'hybrid')).toLowerCase() as 'indica' | 'sativa' | 'hybrid',
          thc: parseFloat(String(data.total_thc || '0')) || 0,
          cbd: parseFloat(String(data.total_cbd || '0')) || 0,
          effects: typeof data.effects === 'string' ? data.effects.split(',') : [],
          flavors: typeof data.aromas === 'string' ? data.aromas.split(',') : [],
          description: String(data.description || ''),
          source: 'Cannlytics'
        }
      
      default:
        return {
          id: 'unknown',
          name: 'Unknown Strain',
          type: 'hybrid',
          thc: 0,
          cbd: 0,
          effects: [],
          flavors: [],
          description: '',
          source: 'Unknown'
        }
    }
  }
}
