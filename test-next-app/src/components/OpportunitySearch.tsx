import React, { useState, useEffect } from 'react'
import { createSupabaseClient } from '../lib/supabase'
import { Search, Filter, Star, Calendar, DollarSign, Building } from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  agency: string
  description: string
  amount_max: number
  application_deadline: string
  opportunity_type: string
  fit_score?: number
}

export default function OpportunitySearch() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    agency: '',
    opportunity_type: '',
    amount_min: '',
    amount_max: ''
  })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const supabase = createClientComponentClient()

  useEffect(() => {
    searchOpportunities()
  }, [searchQuery, filters, page])

  const searchOpportunities = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.functions.invoke('search-opportunities', {
        body: {
          query: searchQuery,
          filters: {
            ...filters,
            amount_min: filters.amount_min ? parseInt(filters.amount_min) : undefined,
            amount_max: filters.amount_max ? parseInt(filters.amount_max) : undefined
          },
          page,
          limit: 20
        }
      })

      if (page === 1) {
        setOpportunities(data?.opportunities || [])
      } else {
        setOpportunities(prev => [...prev, ...(data?.opportunities || [])])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (opportunityId: string) => {
    try {
      // Navigate to application form or trigger auto-fill
      window.location.href = `/apply/${opportunityId}`
    } catch (error) {
      console.error('Apply error:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Opportunities</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search grants, contracts, and opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select
            value={filters.agency}
            onChange={(e) => setFilters(prev => ({ ...prev, agency: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Agencies</option>
            <option value="Department of Defense">Department of Defense</option>
            <option value="Department of Energy">Department of Energy</option>
            <option value="National Science Foundation">National Science Foundation</option>
            <option value="NASA">NASA</option>
          </select>

          <select
            value={filters.opportunity_type}
            onChange={(e) => setFilters(prev => ({ ...prev, opportunity_type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="grant">Grants</option>
            <option value="contract">Contracts</option>
            <option value="sbir">SBIR</option>
            <option value="sttr">STTR</option>
          </select>

          <input
            type="number"
            placeholder="Min Amount"
            value={filters.amount_min}
            onChange={(e) => setFilters(prev => ({ ...prev, amount_min: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Max Amount"
            value={filters.amount_max}
            onChange={(e) => setFilters(prev => ({ ...prev, amount_max: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            onApply={() => handleApply(opportunity.id)}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {opportunities.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

