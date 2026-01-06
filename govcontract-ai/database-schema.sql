-- GovContractAI: Complete Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'company_owner', 'team_member');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid');
CREATE TYPE subscription_tier AS ENUM ('starter', 'professional', 'enterprise', 'all_access');
CREATE TYPE jurisdiction_type AS ENUM ('city', 'county', 'state', 'federal');
CREATE TYPE opportunity_type AS ENUM ('rfp', 'rfq', 'rfi', 'grant', 'sole_source', 'gsa');
CREATE TYPE application_status AS ENUM ('draft', 'in_progress', 'submitted', 'under_review', 'awarded', 'rejected');
CREATE TYPE data_freshness_level AS ENUM ('real_time', 'daily', 'weekly', 'monthly');
CREATE TYPE certification_status AS ENUM ('pending', 'active', 'expired', 'revoked');

-- ============================================================================
-- CORE USER & COMPANY TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'team_member',
    company_id UUID,
    phone TEXT,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    industry TEXT NOT NULL,
    company_size TEXT,
    founded_year INTEGER,
    annual_revenue TEXT,
    headquarters_address JSONB,
    business_type TEXT,
    tax_id TEXT,
    duns_number TEXT,
    cage_code TEXT,
    capabilities TEXT[],
    certifications TEXT[],
    target_jurisdictions TEXT[],
    profile_data JSONB,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key relationship
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_company 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ============================================================================
-- SUBSCRIPTION & BILLING TABLES
-- ============================================================================

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status subscription_status NOT NULL,
    tier subscription_tier NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    jurisdiction_access TEXT[],
    monthly_ai_requests_limit INTEGER DEFAULT 1000,
    monthly_ai_requests_used INTEGER DEFAULT 0,
    price_per_month INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission tracking table
CREATE TABLE commission_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contract_award_id UUID,
    contract_value DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    platform_share DECIMAL(12,2) NOT NULL,
    client_share DECIMAL(12,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    stripe_payout_id TEXT,
    contract_start_date DATE,
    verification_documents JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- JURISDICTION & OPPORTUNITY TABLES
-- ============================================================================

-- Jurisdictions table
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type jurisdiction_type NOT NULL,
    state_code TEXT,
    parent_jurisdiction_id UUID REFERENCES jurisdictions(id),
    population INTEGER,
    annual_budget BIGINT,
    procurement_budget BIGINT,
    website TEXT,
    procurement_portal_url TEXT,
    vendor_registration_url TEXT,
    contact_info JSONB,
    real_world_data JSONB,
    procurement_patterns JSONB,
    key_industries TEXT[],
    upcoming_initiatives TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    agency TEXT NOT NULL,
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    type opportunity_type NOT NULL,
    estimated_value TEXT,
    estimated_value_min DECIMAL(15,2),
    estimated_value_max DECIMAL(15,2),
    due_date TIMESTAMP WITH TIME ZONE,
    response_due_date TIMESTAMP WITH TIME ZONE,
    award_date TIMESTAMP WITH TIME ZONE,
    performance_period TEXT,
    solicitation_number TEXT,
    naics_codes TEXT[],
    psc_codes TEXT[],
    requirements TEXT[],
    evaluation_criteria JSONB,
    technical_requirements TEXT[],
    compliance_requirements TEXT[],
    key_dates JSONB,
    contact_info JSONB,
    submission_method TEXT,
    document_urls TEXT[],
    amendment_info JSONB,
    small_business_setasides TEXT[],
    security_clearance_required BOOLEAN DEFAULT FALSE,
    teaming_opportunities TEXT[],
    ai_analysis JSONB,
    competition_level TEXT,
    win_probability_factors TEXT[],
    source_url TEXT,
    source_system TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APPLICATION & SUBMISSION TABLES
-- ============================================================================

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    status application_status DEFAULT 'draft',
    form_data JSONB DEFAULT '{}',
    uploaded_documents JSONB DEFAULT '[]',
    ai_generated_content JSONB DEFAULT '{}',
    quality_score INTEGER,
    last_quality_check TIMESTAMP WITH TIME ZONE,
    compliance_status JSONB,
    submission_date TIMESTAMP WITH TIME ZONE,
    submission_confirmation TEXT,
    tracking_number TEXT,
    estimated_completion_time INTEGER,
    time_spent INTEGER DEFAULT 0,
    notes TEXT,
    team_members UUID[],
    workflow_stage TEXT DEFAULT 'initial_review',
    is_submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application workflows table
CREATE TABLE application_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    requirements TEXT[],
    completed_by UUID REFERENCES profiles(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AI & CACHING TABLES
-- ============================================================================

-- Data cache table
CREATE TABLE data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key TEXT NOT NULL,
    data_type data_freshness_level NOT NULL,
    industry TEXT NOT NULL,
    jurisdiction TEXT,
    jurisdiction_type jurisdiction_type,
    data_content JSONB NOT NULL,
    freshness_level data_freshness_level NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    api_source TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    cost_savings DECIMAL(10,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Industry similarity mapping
CREATE TABLE industry_similarity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_industry TEXT NOT NULL,
    similar_industries TEXT[] NOT NULL,
    similarity_score DECIMAL(3,2) NOT NULL,
    data_overlap_percentage INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage logs
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    company_id UUID REFERENCES companies(id),
    function_name TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    processing_time_ms INTEGER,
    estimated_cost DECIMAL(10,6),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application scores table
CREATE TABLE application_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    score_data JSONB NOT NULL,
    overall_score INTEGER NOT NULL,
    category_scores JSONB,
    improvement_suggestions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document analyses table
CREATE TABLE document_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    application_id UUID REFERENCES applications(id),
    document_type TEXT NOT NULL,
    document_url TEXT,
    analysis_data JSONB NOT NULL,
    enhanced_features JSONB,
    confidence_score DECIMAL(5,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights table
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES opportunities(id),
    insight_type TEXT NOT NULL,
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(5,2),
    match_score INTEGER,
    win_probability INTEGER,
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CERTIFICATION & VENDOR MANAGEMENT
-- ============================================================================

-- Certifications table
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    certification_type TEXT NOT NULL,
    certification_name TEXT NOT NULL,
    issuing_authority TEXT,
    certification_number TEXT,
    issue_date DATE,
    expiration_date DATE,
    status certification_status DEFAULT 'pending',
    verification_documents JSONB DEFAULT '[]',
    auto_renewal BOOLEAN DEFAULT FALSE,
    reminder_days_before_expiry INTEGER DEFAULT 30,
    jurisdiction_scope TEXT[],
    benefits TEXT[],
    seal_url TEXT,
    verification_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor registrations table
CREATE TABLE vendor_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
    vendor_number TEXT,
    registration_status TEXT DEFAULT 'not_started',
    registration_date DATE,
    expiration_date DATE,
    renewal_date DATE,
    portal_login_url TEXT,
    username TEXT,
    requirements_completed JSONB DEFAULT '{}',
    required_documents JSONB DEFAULT '[]',
    submitted_documents JSONB DEFAULT '[]',
    compliance_status JSONB DEFAULT '{}',
    notes TEXT,
    last_updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMMUNICATION & SUPPORT TABLES
-- ============================================================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'normal',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    company_id UUID REFERENCES companies(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    category TEXT,
    assigned_to UUID REFERENCES profiles(id),
    ai_suggested_response TEXT,
    resolution_notes TEXT,
    satisfaction_rating INTEGER,
    tags TEXT[],
    attachments JSONB DEFAULT '[]',
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data requests table
CREATE TABLE data_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    company_id UUID REFERENCES companies(id),
    cache_key TEXT NOT NULL,
    cache_hit BOOLEAN NOT NULL,
    api_cost DECIMAL(10,4),
    response_time_ms INTEGER,
    data_source TEXT,
    industry TEXT,
    jurisdiction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profile indexes
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Company indexes
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- Subscription indexes
CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Opportunity indexes
CREATE INDEX idx_opportunities_jurisdiction_id ON opportunities(jurisdiction_id);
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_due_date ON opportunities(due_date);
CREATE INDEX idx_opportunities_is_active ON opportunities(is_active);
CREATE INDEX idx_opportunities_naics_codes ON opportunities USING GIN(naics_codes);

-- Application indexes
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_by ON applications(created_by);

-- Cache indexes
CREATE INDEX idx_data_cache_key ON data_cache(cache_key);
CREATE INDEX idx_data_cache_industry ON data_cache(industry, jurisdiction);
CREATE INDEX idx_data_cache_expires ON data_cache(expires_at);
CREATE INDEX idx_data_cache_type ON data_cache(data_type);

-- AI usage indexes
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_company_id ON ai_usage_logs(company_id);
CREATE INDEX idx_ai_usage_logs_function_name ON ai_usage_logs(function_name);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Companies policies
CREATE POLICY "Company members can view their company" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company owners can update their company" ON companies
    FOR UPDATE USING (
        id IN (
            SELECT company_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'company_owner')
        )
    );

-- Applications policies
CREATE POLICY "Company members can view their applications" ON applications
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Company members can manage their applications" ON applications
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Subscriptions policies
CREATE POLICY "Company members can view their subscription" ON subscriptions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

-- AI usage policies
CREATE POLICY "Users can view own AI usage" ON ai_usage_logs
    FOR SELECT USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Opportunities are public (with subscription-based filtering in app layer)
CREATE POLICY "All authenticated users can view opportunities" ON opportunities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Jurisdictions are public
CREATE POLICY "All authenticated users can view jurisdictions" ON jurisdictions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Industry similarity is public
CREATE POLICY "All authenticated users can view industry similarity" ON industry_similarity
    FOR SELECT USING (auth.role() = 'authenticated');

-- Data cache policies (service role only for management)
CREATE POLICY "Service role can manage data cache" ON data_cache
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS (SIMPLIFIED WORKING VERSIONS)
-- ============================================================================

-- Simple function to get cache analytics
CREATE OR REPLACE FUNCTION get_cache_analytics(days_back INTEGER DEFAULT 30)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'cache_hits', COALESCE(COUNT(*) FILTER (WHERE cache_hit = true), 0),
            'cache_misses', COALESCE(COUNT(*) FILTER (WHERE cache_hit = false), 0),
            'total_requests', COALESCE(COUNT(*), 0),
            'actual_api_cost', COALESCE(SUM(api_cost), 0),
            'hit_rate', CASE 
                WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE cache_hit = true)::DECIMAL / COUNT(*)) * 100, 2)
                ELSE 0 
            END
        )
        FROM data_requests
        WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    );
END;
$$;

-- Function to calculate application quality score
CREATE OR REPLACE FUNCTION calculate_application_quality_score(app_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    score INTEGER := 0;
    app_data JSONB;
BEGIN
    SELECT form_data INTO app_data FROM applications WHERE id = app_id;
    
    -- Basic scoring logic
    IF app_data IS NOT NULL THEN
        IF app_data ? 'technical_approach' AND app_data->>'technical_approach' != '' THEN
            score := score + 20;
        END IF;
        
        IF app_data ? 'past_performance' AND app_data->>'past_performance' != '' THEN
            score := score + 25;
        END IF;
        
        IF app_data ? 'pricing_strategy' AND app_data->>'pricing_strategy' != '' THEN
            score := score + 20;
        END IF;
        
        IF app_data ? 'team_members' AND jsonb_array_length(app_data->'team_members') > 0 THEN
            score := score + 15;
        END IF;
        
        IF app_data ? 'compliance_statement' AND app_data->>'compliance_statement' != '' THEN
            score := score + 20;
        END IF;
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$;

-- Function to update subscription AI usage
CREATE OR REPLACE FUNCTION increment_ai_usage(company_uuid UUID, requests_used INTEGER DEFAULT 1)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    updated_rows INTEGER;
BEGIN
    UPDATE subscriptions 
    SET 
        monthly_ai_requests_used = monthly_ai_requests_used + requests_used,
        updated_at = NOW()
    WHERE company_id = company_uuid 
      AND status = 'active'
      AND monthly_ai_requests_used + requests_used <= monthly_ai_requests_limit;
    
    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    RETURN updated_rows > 0;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply update triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at 
    BEFORE UPDATE ON certifications
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_registrations_updated_at 
    BEFORE UPDATE ON vendor_registrations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA POPULATION
-- ============================================================================

-- Insert industry similarity data
INSERT INTO industry_similarity (primary_industry, similar_industries, similarity_score, data_overlap_percentage) VALUES
('environmental_services', ARRAY['waste_management', 'recycling', 'sustainability_consulting', 'green_energy'], 0.85, 75),
('construction', ARRAY['infrastructure', 'civil_engineering', 'architecture', 'project_management'], 0.80, 70),
('it_services', ARRAY['software_development', 'cybersecurity', 'cloud_services', 'data_analytics'], 0.75, 80),
('consulting', ARRAY['management_consulting', 'business_analysis', 'strategy_consulting', 'process_improvement'], 0.90, 85),
('logistics', ARRAY['transportation', 'supply_chain', 'warehousing', 'distribution'], 0.85, 78),
('healthcare', ARRAY['medical_services', 'health_consulting', 'medical_equipment', 'pharmaceutical'], 0.75, 65),
('education', ARRAY['training_services', 'curriculum_development', 'educational_technology', 'research'], 0.80, 70),
('security', ARRAY['cybersecurity', 'physical_security', 'risk_management', 'compliance'], 0.85, 75);

-- Insert sample jurisdictions
INSERT INTO jurisdictions (name, type, state_code, population, annual_budget, procurement_budget, website) VALUES
('Federal Government', 'federal', NULL, 331000000, 6000000000000, 600000000000, 'https://sam.gov'),
('California', 'state', 'CA', 39500000, 262000000000, 26000000000, 'https://www.ca.gov'),
('Los Angeles County', 'county', 'CA', 10000000, 38000000000, 3800000000, 'https://lacounty.gov'),
('City of Los Angeles', 'city', 'CA', 4000000, 11000000000, 1100000000, 'https://lacity.org'),
('City of San Diego', 'city', 'CA', 1400000, 4200000000, 420000000, 'https://sandiego.gov'),
('Orange County', 'county', 'CA', 3200000, 7500000000, 750000000, 'https://ocgov.com');

-- Success! Schema is complete and ready for use.