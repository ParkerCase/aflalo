'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X,
  Building2,
  MapPin,
  Globe,
  Users,
  Target,
  Award
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabaseClient'

interface CompanyData {
  id: string
  name: string
  description?: string
  industry?: string
  business_type?: string
  company_size?: string
  website?: string
  headquarters_location?: string
  annual_revenue?: string
  years_in_business?: string
  employee_count?: string
  naics_codes?: string[]
  certifications?: string[]
  capabilities?: string[]
  target_jurisdictions?: string[]
  past_performance_rating?: string
}

const industryOptions = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Government',
  'Manufacturing',
  'Construction',
  'Professional Services',
  'Consulting',
  'Research & Development',
  'Other'
]

const businessTypeOptions = [
  'Small Business',
  'Large Business',
  'Nonprofit',
  'Educational Institution',
  'Government Entity',
  'Other'
]

const companySizeOptions = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees'
]

const certificationOptions = [
  'SBA - Small Business Administration',
  'WOSB - Woman-Owned Small Business',
  'VOSB - Veteran-Owned Small Business',
  '8(a) - Small Disadvantaged Business',
  'HUBZone - Historically Underutilized Business Zone',
  'SDVOSB - Service-Disabled Veteran-Owned Small Business',
  'ISO 9001',
  'ISO 27001',
  'SOC 2',
  'FedRAMP',
  'CMMI'
]

const jurisdictionOptions = [
  'Federal',
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming'
]

export default function CompanySettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [companyData, setCompanyData] = useState<CompanyData>({
    id: '',
    name: '',
    description: '',
    industry: '',
    business_type: '',
    company_size: '',
    website: '',
    headquarters_location: '',
    annual_revenue: '',
    years_in_business: '',
    employee_count: '',
    naics_codes: [],
    certifications: [],
    capabilities: [],
    target_jurisdictions: [],
    past_performance_rating: ''
  })
  const [newNaicsCode, setNewNaicsCode] = useState('')
  const [newCapability, setNewCapability] = useState('')

  useEffect(() => {
    loadCompanyData()
  }, [])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (!profile?.company_id) return

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()

      if (company) {
        setCompanyData({
          id: company.id,
          name: company.name || '',
          description: company.description || '',
          industry: company.industry || '',
          business_type: company.business_type || '',
          company_size: company.company_size || '',
          website: company.website || '',
          headquarters_location: company.headquarters_location || '',
          annual_revenue: company.annual_revenue?.toString() || '',
          years_in_business: company.years_in_business?.toString() || '',
          employee_count: company.employee_count?.toString() || '',
          naics_codes: company.naics_codes || [],
          certifications: company.certifications || [],
          capabilities: company.capabilities || [],
          target_jurisdictions: company.target_jurisdictions || [],
          past_performance_rating: company.past_performance_rating?.toString() || ''
        })
      }
    } catch (error) {
      console.error('Error loading company data:', error)
      toast({
        title: "Error",
        description: "Failed to load company data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addArrayItem = (field: 'naics_codes' | 'capabilities', value: string) => {
    if (value.trim() && !companyData[field]?.includes(value.trim())) {
      setCompanyData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }))
    }
  }

  const removeArrayItem = (field: 'naics_codes' | 'certifications' | 'capabilities' | 'target_jurisdictions', index: number) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }))
  }

  const toggleCertification = (certification: string) => {
    const isSelected = companyData.certifications?.includes(certification)
    if (isSelected) {
      setCompanyData(prev => ({
        ...prev,
        certifications: prev.certifications?.filter(c => c !== certification) || []
      }))
    } else {
      setCompanyData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), certification]
      }))
    }
  }

  const toggleJurisdiction = (jurisdiction: string) => {
    const isSelected = companyData.target_jurisdictions?.includes(jurisdiction)
    if (isSelected) {
      setCompanyData(prev => ({
        ...prev,
        target_jurisdictions: prev.target_jurisdictions?.filter(j => j !== jurisdiction) || []
      }))
    } else {
      setCompanyData(prev => ({
        ...prev,
        target_jurisdictions: [...(prev.target_jurisdictions || []), jurisdiction]
      }))
    }
  }

  const saveCompanyData = async () => {
    try {
      setSaving(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const updateData = {
        name: companyData.name,
        description: companyData.description,
        industry: companyData.industry,
        business_type: companyData.business_type,
        company_size: companyData.company_size,
        website: companyData.website,
        headquarters_location: companyData.headquarters_location,
        annual_revenue: companyData.annual_revenue ? parseInt(companyData.annual_revenue) : null,
        years_in_business: companyData.years_in_business ? parseInt(companyData.years_in_business) : null,
        employee_count: companyData.employee_count ? parseInt(companyData.employee_count) : null,
        naics_codes: companyData.naics_codes,
        certifications: companyData.certifications,
        capabilities: companyData.capabilities,
        target_jurisdictions: companyData.target_jurisdictions,
        past_performance_rating: companyData.past_performance_rating ? parseFloat(companyData.past_performance_rating) : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyData.id)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Company profile updated successfully.",
      })

      router.push('/company')
    } catch (error) {
      console.error('Error saving company data:', error)
      toast({
        title: "Error",
        description: "Failed to save company data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/company')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Company
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Company Settings</h1>
            <p className="text-muted-foreground">
              Update your company information to improve AI matching
            </p>
          </div>
        </div>
        <Button onClick={saveCompanyData} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Essential company details for profile and matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={companyData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={companyData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your company..."
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={companyData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={companyData.business_type} onValueChange={(value) => handleInputChange('business_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={companyData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizeOptions.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={companyData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="location">Headquarters Location</Label>
                <Input
                  id="location"
                  value={companyData.headquarters_location}
                  onChange={(e) => handleInputChange('headquarters_location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial & Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Financial & Performance
            </CardTitle>
            <CardDescription>
              Company metrics for better opportunity matching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="annualRevenue">Annual Revenue ($)</Label>
                <Input
                  id="annualRevenue"
                  type="number"
                  value={companyData.annual_revenue}
                  onChange={(e) => handleInputChange('annual_revenue', e.target.value)}
                  placeholder="1000000"
                />
              </div>

              <div>
                <Label htmlFor="yearsInBusiness">Years in Business</Label>
                <Input
                  id="yearsInBusiness"
                  type="number"
                  value={companyData.years_in_business}
                  onChange={(e) => handleInputChange('years_in_business', e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  value={companyData.employee_count}
                  onChange={(e) => handleInputChange('employee_count', e.target.value)}
                  placeholder="25"
                />
              </div>

              <div>
                <Label htmlFor="performanceRating">Past Performance Rating (1-5)</Label>
                <Input
                  id="performanceRating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={companyData.past_performance_rating}
                  onChange={(e) => handleInputChange('past_performance_rating', e.target.value)}
                  placeholder="4.2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NAICS Codes */}
        <Card>
          <CardHeader>
            <CardTitle>NAICS Codes</CardTitle>
            <CardDescription>
              North American Industry Classification System codes for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newNaicsCode}
                onChange={(e) => setNewNaicsCode(e.target.value)}
                placeholder="Enter NAICS code (e.g., 541511)"
                maxLength={6}
              />
              <Button 
                onClick={() => {
                  addArrayItem('naics_codes', newNaicsCode)
                  setNewNaicsCode('')
                }}
                disabled={!newNaicsCode.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {companyData.naics_codes?.map((code, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {code}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeArrayItem('naics_codes', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Capabilities
            </CardTitle>
            <CardDescription>
              Key capabilities and services your company offers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                placeholder="Enter capability (e.g., Software Development)"
              />
              <Button 
                onClick={() => {
                  addArrayItem('capabilities', newCapability)
                  setNewCapability('')
                }}
                disabled={!newCapability.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {companyData.capabilities?.map((capability, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {capability}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeArrayItem('capabilities', index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
            <CardDescription>
              Select your company's certifications to improve matching accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {certificationOptions.map((certification) => (
                <div
                  key={certification}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    companyData.certifications?.includes(certification)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleCertification(certification)}
                >
                  <div className="text-sm font-medium">{certification}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Jurisdictions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Target Jurisdictions
            </CardTitle>
            <CardDescription>
              Select the jurisdictions where you want to pursue opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {jurisdictionOptions.map((jurisdiction) => (
                <div
                  key={jurisdiction}
                  className={`p-2 rounded border cursor-pointer transition-colors text-center ${
                    companyData.target_jurisdictions?.includes(jurisdiction)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleJurisdiction(jurisdiction)}
                >
                  <div className="text-xs font-medium">{jurisdiction}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveCompanyData} disabled={saving} size="lg">
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
