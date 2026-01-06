-- Add SAM.gov API key field to user profiles for compliance
ALTER TABLE user_profiles 
ADD COLUMN sam_gov_api_key TEXT,
ADD COLUMN sam_gov_key_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN sam_gov_key_last_verified TIMESTAMP,
ADD COLUMN api_compliance_acknowledged BOOLEAN DEFAULT FALSE,
ADD COLUMN api_compliance_date TIMESTAMP;

-- Add compliance tracking
CREATE TABLE api_compliance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_provider TEXT NOT NULL, -- 'sam_gov', 'grants_gov', etc.
    compliance_action TEXT NOT NULL, -- 'key_added', 'key_verified', 'terms_acknowledged'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE api_compliance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own compliance log" ON api_compliance_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compliance log" ON api_compliance_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create compliance view
CREATE OR REPLACE VIEW user_api_compliance AS
SELECT 
    up.id,
    up.sam_gov_api_key IS NOT NULL as has_sam_gov_key,
    up.sam_gov_key_verified,
    up.sam_gov_key_last_verified,
    up.api_compliance_acknowledged,
    up.api_compliance_date,
    CASE 
        WHEN up.sam_gov_api_key IS NOT NULL AND up.sam_gov_key_verified = TRUE 
        THEN 'compliant'
        WHEN up.sam_gov_api_key IS NOT NULL AND up.sam_gov_key_verified = FALSE 
        THEN 'key_unverified'
        ELSE 'key_required'
    END as compliance_status
FROM user_profiles up;
