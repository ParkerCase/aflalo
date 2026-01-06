import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: opportunityId } = await params

    // Mock data - in real implementation, this would fetch from multiple sources
    const mockOpportunities: Record<string, any> = {
      'sam-001': {
        id: 'sam-001',
        title: 'Software Development Services for Agency Modernization',
        description: 'The Department of Defense seeks a contractor to provide software development services for modernizing legacy systems. This includes full-stack development, database migration, and cloud infrastructure setup. The selected contractor will work closely with our IT team to ensure seamless integration with existing systems while maintaining the highest security standards. This is a multi-phase project that will span 18 months with potential for extension based on performance and additional requirements.',
        organization: 'Department of Defense',
        department: 'DoD',
        postedDate: '2024-06-15',
        deadline: '2024-07-30',
        awardAmount: '$2,500,000',
        location: 'Washington, DC',
        naicsCodes: ['541511', '541512'],
        setAside: 'Small Business Set-Aside',
        contact: {
          fullName: 'John Smith',
          email: 'john.smith@defense.gov',
          phone: '(555) 123-4567'
        },
        links: [
          { rel: 'self', href: 'https://sam.gov/opp/sam-001' },
          { rel: 'application', href: 'https://sam.gov/apply/sam-001' }
        ],
        source: 'SAM.gov',
        type: 'contract',
        matchScore: 85,
        winProbability: 0.68
      },
      'sam-002': {
        id: 'sam-002',
        title: 'Cybersecurity Assessment and Implementation',
        description: 'Department of Homeland Security requires comprehensive cybersecurity assessment and implementation services for critical infrastructure protection. The contractor will conduct vulnerability assessments, develop security protocols, implement monitoring systems, and provide ongoing support. This includes both technical implementation and staff training components to ensure long-term security maintenance.',
        organization: 'Department of Homeland Security',
        department: 'DHS',
        postedDate: '2024-06-10',
        deadline: '2024-08-15',
        awardAmount: '$1,800,000',
        location: 'Arlington, VA',
        naicsCodes: ['541512', '541519'],
        setAside: 'Veteran-Owned Small Business Set-Aside',
        contact: {
          fullName: 'Sarah Johnson',
          email: 'sarah.johnson@dhs.gov',
          phone: '(555) 234-5678'
        },
        links: [
          { rel: 'self', href: 'https://sam.gov/opp/sam-002' }
        ],
        source: 'SAM.gov',
        type: 'contract',
        matchScore: 78,
        winProbability: 0.55
      },
      'sam-003': {
        id: 'sam-003',
        title: 'Cloud Infrastructure Migration Services',
        description: 'General Services Administration needs contractor support for migrating on-premise infrastructure to secure cloud platforms with compliance requirements. The project involves assessment of current infrastructure, planning migration strategy, executing the migration, and providing post-migration support. All work must comply with FedRAMP and other federal security requirements.',
        organization: 'General Services Administration',
        department: 'GSA',
        postedDate: '2024-06-12',
        deadline: '2024-07-28',
        awardAmount: '$3,200,000',
        location: 'Washington, DC',
        naicsCodes: ['541511', '518210'],
        setAside: null,
        contact: {
          fullName: 'Michael Davis',
          email: 'michael.davis@gsa.gov',
          phone: '(555) 345-6789'
        },
        links: [
          { rel: 'self', href: 'https://sam.gov/opp/sam-003' }
        ],
        source: 'SAM.gov',
        type: 'contract',
        matchScore: 92,
        winProbability: 0.73
      },
      'grant-001': {
        id: 'grant-001',
        title: 'Small Business Innovation Research (SBIR) Technology Development',
        description: 'The SBIR program aims to stimulate technological innovation by funding early-stage research and development projects with commercial potential. This grant supports small businesses in developing innovative technologies that can address federal agency needs while creating commercial opportunities. Applicants must demonstrate technical merit, commercial potential, and the capability to execute the proposed research.',
        organization: 'National Science Foundation',
        department: 'NSF',
        postedDate: '2024-06-01',
        deadline: '2024-08-01',
        awardAmount: 'Up to $500,000',
        location: null,
        naicsCodes: [],
        setAside: 'Small businesses',
        contact: null,
        links: [
          { rel: 'application', href: 'https://grants.gov/apply/grant-001' }
        ],
        source: 'Grants.gov',
        type: 'grant',
        matchScore: 71,
        winProbability: 0.42
      },
      'grant-002': {
        id: 'grant-002',
        title: 'Biomedical Research and Development Grant',
        description: 'Support for innovative biomedical research projects that advance our understanding of human health and disease. This grant program encourages collaborative research between academic institutions, small businesses, and non-profit organizations. Priority areas include novel therapeutic approaches, diagnostic technologies, and precision medicine initiatives.',
        organization: 'National Institutes of Health',
        department: 'NIH',
        postedDate: '2024-06-05',
        deadline: '2024-09-15',
        awardAmount: 'Up to $750,000',
        location: null,
        naicsCodes: [],
        setAside: 'Universities, small businesses, non-profits',
        contact: null,
        links: [
          { rel: 'application', href: 'https://grants.gov/apply/grant-002' }
        ],
        source: 'Grants.gov',
        type: 'grant',
        matchScore: 64,
        winProbability: 0.35
      },
      'grant-003': {
        id: 'grant-003',
        title: 'Clean Energy Technology Innovation Grant',
        description: 'Funding for breakthrough clean energy technologies that can accelerate the transition to sustainable energy systems. This grant supports research and development of renewable energy technologies, energy storage solutions, and energy efficiency innovations. Projects should demonstrate potential for commercial viability and significant environmental impact.',
        organization: 'Department of Energy',
        department: 'DOE',
        postedDate: '2024-06-08',
        deadline: '2024-08-30',
        awardAmount: 'Up to $1,000,000',
        location: null,
        naicsCodes: [],
        setAside: 'All eligible entities',
        contact: null,
        links: [
          { rel: 'application', href: 'https://grants.gov/apply/grant-003' }
        ],
        source: 'Grants.gov',
        type: 'grant',
        matchScore: 88,
        winProbability: 0.59
      },
      'db-001': {
        id: 'db-001',
        title: 'AI-Powered Analytics Platform Development',
        description: 'Develop a comprehensive analytics platform using artificial intelligence to process large datasets for federal agencies. The solution must include real-time dashboards, predictive modeling, and automated reporting capabilities. The platform should be scalable, secure, and comply with federal data handling requirements. Integration with existing government systems is required.',
        organization: 'Department of Commerce',
        department: 'Bureau of Economic Analysis',
        postedDate: '2024-06-14',
        deadline: '2024-08-20',
        awardAmount: '$1,200,000',
        location: 'Washington, DC',
        naicsCodes: ['541511', '541512'],
        setAside: 'Small Business Set-Aside',
        contact: {
          fullName: 'Jennifer Wilson',
          email: 'jennifer.wilson@commerce.gov',
          phone: '(555) 456-7890'
        },
        links: [
          { rel: 'self', href: 'https://procurement.commerce.gov/opp/db-001' }
        ],
        source: 'Database',
        type: 'opportunity',
        matchScore: 95,
        winProbability: 0.81
      },
      'db-002': {
        id: 'db-002',
        title: 'Digital Transformation Consulting Services',
        description: 'Provide strategic consulting services to modernize legacy government systems. Includes assessment, planning, implementation roadmap, and change management support. The consultant will work with multiple departments to identify opportunities for digital transformation, develop comprehensive strategies, and support implementation efforts.',
        organization: 'Department of Veterans Affairs',
        department: 'Office of Information Technology',
        postedDate: '2024-06-16',
        deadline: '2024-07-25',
        awardAmount: '$950,000',
        location: 'Remote/Various',
        naicsCodes: ['541611', '541618'],
        setAside: null,
        contact: {
          fullName: 'Robert Chen',
          email: 'robert.chen@va.gov',
          phone: '(555) 567-8901'
        },
        links: [
          { rel: 'self', href: 'https://procurement.va.gov/opp/db-002' }
        ],
        source: 'Database',
        type: 'opportunity',
        matchScore: 82,
        winProbability: 0.67
      }
    }

    const opportunity = mockOpportunities[opportunityId]

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      opportunity
    })

  } catch (error) {
    console.error('Opportunity details error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
