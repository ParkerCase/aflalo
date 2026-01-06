

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."advance_workflow_step"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if current step data is completed
  IF NEW.step_data ? NEW.current_step::TEXT THEN
    -- Move to next step if not at the end
    IF NEW.current_step < NEW.total_steps THEN
      NEW.current_step := NEW.current_step + 1;
      NEW.completed_steps := array_append(NEW.completed_steps, OLD.current_step);
    END IF;
    
    -- Notify application of workflow progress
    PERFORM pg_notify('workflow_progress', 
      json_build_object(
        'workflow_id', NEW.id,
        'application_id', NEW.application_id,
        'current_step', NEW.current_step,
        'completed_steps', NEW.completed_steps
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."advance_workflow_step"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_monitoring_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Keep error logs for 90 days
  DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Keep rate limits for 1 day
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 day';
  
  -- Keep API usage for 30 days
  DELETE FROM api_usage WHERE timestamp < NOW() - INTERVAL '30 days';
  
  -- Keep user events for 365 days
  DELETE FROM user_events WHERE timestamp < NOW() - INTERVAL '365 days';
  
  -- Keep performance metrics for 30 days
  DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_monitoring_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_metrics"() RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'new_users_this_month', (
      SELECT COUNT(*) FROM profiles 
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'total_applications', (SELECT COUNT(*) FROM applications),
    'applications_this_month', (
      SELECT COUNT(*) FROM applications 
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(
        CASE subscription_tier
          WHEN 'starter' THEN 99
          WHEN 'professional' THEN 299
          WHEN 'enterprise' THEN 699
          ELSE 0
        END
      ), 0) FROM profiles WHERE subscription_status = 'active'
    ),
    'platform_success_rate', (
      SELECT ROUND(
        (COUNT(CASE WHEN status = 'approved' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(CASE WHEN status IN ('approved', 'rejected') THEN 1 END), 0)) * 100, 1
      ) FROM applications
    ),
    'user_growth_data', (
      SELECT json_agg(
        json_build_object(
          'month', TO_CHAR(month_series, 'Mon YYYY'),
          'new_users', COALESCE(user_counts.count, 0),
          'total_users', SUM(COALESCE(user_counts.count, 0)) OVER (ORDER BY month_series)
        )
      )
      FROM (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        ) AS month_series
      ) months
      LEFT JOIN (
        SELECT 
          date_trunc('month', created_at) as month,
          COUNT(*) as count
        FROM profiles 
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY date_trunc('month', created_at)
      ) user_counts ON months.month_series = user_counts.month
    ),
    'revenue_by_plan', (
      SELECT json_agg(
        json_build_object(
          'plan', subscription_tier,
          'revenue', plan_revenue
        )
      )
      FROM (
        SELECT 
          subscription_tier as subscription_tier,
          COUNT(*) * CASE subscription_tier
            WHEN 'starter' THEN 99
            WHEN 'professional' THEN 299
            WHEN 'enterprise' THEN 699
            ELSE 0
          END as plan_revenue
        FROM profiles 
        WHERE subscription_status = 'active' AND subscription_tier != 'free'
        GROUP BY subscription_tier
      ) plan_revenues
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_admin_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_dashboard_analytics"("p_user_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_applications', (
      SELECT COUNT(*) FROM applications 
      WHERE user_id = p_user_id AND status IN ('draft', 'in_progress', 'submitted', 'under_review')
    ),
    'win_rate', (
      SELECT ROUND(
        (COUNT(CASE WHEN status = 'approved' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(CASE WHEN status IN ('approved', 'rejected') THEN 1 END), 0)) * 100, 1
      )
      FROM applications WHERE user_id = p_user_id
    ),
    'total_won', (
      SELECT COALESCE(SUM(award_amount), 0) 
      FROM applications WHERE user_id = p_user_id AND status = 'approved'
    ),
    'avg_time_to_award', (
      SELECT ROUND(AVG(EXTRACT(days FROM (decision_date - submitted_at))))
      FROM applications 
      WHERE user_id = p_user_id AND status = 'approved' AND decision_date IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_user_dashboard_analytics"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agency_status_patterns" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agency" "text" NOT NULL,
    "status_url_pattern" "text" NOT NULL,
    "parsing_rules" "jsonb" NOT NULL,
    "check_frequency" interval DEFAULT '24:00:00'::interval,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "success_rate" numeric DEFAULT 0.0
);


ALTER TABLE "public"."agency_status_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_usage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "endpoint" "text" NOT NULL,
    "method" "text" NOT NULL,
    "user_id" "uuid",
    "response_time" integer,
    "status_code" integer,
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."api_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."application_workflows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "workflow_type" "text" NOT NULL,
    "current_step" integer DEFAULT 1,
    "total_steps" integer NOT NULL,
    "step_data" "jsonb" DEFAULT '{}'::"jsonb",
    "completed_steps" integer[] DEFAULT '{}'::integer[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."application_workflows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "opportunity_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "tracking_number" "text",
    "submission_method" "text",
    "submitted_at" timestamp with time zone,
    "decision_date" "date",
    "award_amount" numeric,
    "notes" "text",
    "application_data" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_confidence_score" numeric,
    "time_to_complete" interval,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_status_check" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "applications_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_progress'::"text", 'submitted'::"text", 'under_review'::"text", 'approved'::"text", 'rejected'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "award_amount" numeric NOT NULL,
    "commission_rate" numeric NOT NULL,
    "commission_amount" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" "date",
    "paid_at" timestamp with time zone,
    "stripe_transfer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "level" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "source" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "error_logs_level_check" CHECK (("level" = ANY (ARRAY['error'::"text", 'warning'::"text", 'info'::"text"])))
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "form_template_id" "uuid",
    "filled_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "confidence_scores" "jsonb" DEFAULT '{}'::"jsonb",
    "manual_corrections" "jsonb" DEFAULT '{}'::"jsonb",
    "completion_time" interval,
    "success" boolean,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."form_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agency" "text" NOT NULL,
    "form_name" "text" NOT NULL,
    "form_url" "text",
    "form_type" "text" NOT NULL,
    "form_schema" "jsonb" NOT NULL,
    "field_mappings" "jsonb" NOT NULL,
    "success_rate" numeric DEFAULT 0.5,
    "usage_count" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."form_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "application_id" "uuid",
    "opportunity_id" "uuid",
    "read" boolean DEFAULT false,
    "email_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['status_update'::"text", 'new_opportunity'::"text", 'deadline_reminder'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opportunities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "external_id" "text" NOT NULL,
    "source" "text" NOT NULL,
    "opportunity_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "agency" "text" NOT NULL,
    "sub_agency" "text",
    "office" "text",
    "description" "text",
    "requirements" "text",
    "eligibility_criteria" "text",
    "amount_min" numeric,
    "amount_max" numeric,
    "posted_date" "date",
    "application_deadline" timestamp with time zone,
    "estimated_award_date" "date",
    "performance_period" "text",
    "place_of_performance" "text",
    "naics_codes" "text"[],
    "keywords" "text"[],
    "contact_info" "jsonb" DEFAULT '{}'::"jsonb",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "set_aside_type" "text",
    "contract_type" "text",
    "competition_type" "text",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_scraped_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "opportunities_opportunity_type_check" CHECK (("opportunity_type" = ANY (ARRAY['grant'::"text", 'contract'::"text", 'sbir'::"text", 'sttr'::"text", 'cooperative_agreement'::"text"]))),
    CONSTRAINT "opportunities_source_check" CHECK (("source" = ANY (ARRAY['grants_gov'::"text", 'sam_gov'::"text", 'state_local'::"text", 'other'::"text"]))),
    CONSTRAINT "opportunities_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text", 'cancelled'::"text", 'awarded'::"text"])))
);


ALTER TABLE "public"."opportunities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "duns_number" "text",
    "cage_code" "text",
    "primary_naics_code" "text",
    "secondary_naics_codes" "text"[],
    "business_type" "text",
    "certifications" "jsonb" DEFAULT '{}'::"jsonb",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "key_personnel" "jsonb" DEFAULT '[]'::"jsonb",
    "capabilities" "text"[],
    "past_performance" "jsonb" DEFAULT '[]'::"jsonb",
    "financial_info" "jsonb" DEFAULT '{}'::"jsonb",
    "security_clearances" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organizations_business_type_check" CHECK (("business_type" = ANY (ARRAY['small_business'::"text", 'large_business'::"text", 'nonprofit'::"text", '8a_certified'::"text", 'hubzone'::"text", 'sdvosb'::"text", 'wosb'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "value" numeric NOT NULL,
    "tags" "jsonb" DEFAULT '{}'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_metrics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "metric_data" "jsonb" DEFAULT '{}'::"jsonb",
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "company_name" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "stripe_customer_id" "text",
    "trial_ends_at" timestamp with time zone,
    "onboarding_completed" boolean DEFAULT false,
    CONSTRAINT "profiles_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'trial'::"text"]))),
    CONSTRAINT "profiles_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'starter'::"text", 'professional'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "ip" "text",
    "user_agent" "text",
    "endpoint" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status_checks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "checked_at" timestamp with time zone DEFAULT "now"(),
    "previous_status" "text",
    "new_status" "text",
    "confidence" numeric,
    "raw_response" "text",
    "success" boolean DEFAULT true
);


ALTER TABLE "public"."status_checks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "stripe_price_id" "text" NOT NULL,
    "price_monthly" numeric NOT NULL,
    "price_yearly" numeric,
    "max_applications" integer,
    "max_opportunities_per_search" integer,
    "ai_assistance_included" boolean DEFAULT true,
    "status_monitoring_included" boolean DEFAULT true,
    "analytics_included" boolean DEFAULT true,
    "priority_support" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "opportunity_id" "uuid",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event" "text" NOT NULL,
    "properties" "jsonb" DEFAULT '{}'::"jsonb",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'past_due'::"text", 'unpaid'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agency_status_patterns"
    ADD CONSTRAINT "agency_status_patterns_agency_key" UNIQUE ("agency");



ALTER TABLE ONLY "public"."agency_status_patterns"
    ADD CONSTRAINT "agency_status_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."application_workflows"
    ADD CONSTRAINT "application_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_sessions"
    ADD CONSTRAINT "form_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_agency_form_name_form_type_key" UNIQUE ("agency", "form_name", "form_type");



ALTER TABLE ONLY "public"."form_templates"
    ADD CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_metrics"
    ADD CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_checks"
    ADD CONSTRAINT "status_checks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_stripe_price_id_key" UNIQUE ("stripe_price_id");



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



CREATE INDEX "idx_api_usage_timestamp" ON "public"."api_usage" USING "btree" ("timestamp");



CREATE INDEX "idx_applications_opportunity_id" ON "public"."applications" USING "btree" ("opportunity_id");



CREATE INDEX "idx_applications_status" ON "public"."applications" USING "btree" ("status");



CREATE INDEX "idx_applications_submitted" ON "public"."applications" USING "btree" ("submitted_at");



CREATE INDEX "idx_applications_user_id" ON "public"."applications" USING "btree" ("user_id");



CREATE INDEX "idx_error_logs_created_at" ON "public"."error_logs" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "read", "created_at");



CREATE INDEX "idx_opportunities_agency" ON "public"."opportunities" USING "btree" ("agency");



CREATE INDEX "idx_opportunities_amount" ON "public"."opportunities" USING "btree" ("amount_min", "amount_max");



CREATE INDEX "idx_opportunities_deadline" ON "public"."opportunities" USING "btree" ("application_deadline");



CREATE INDEX "idx_opportunities_keywords" ON "public"."opportunities" USING "gin" ("keywords");



CREATE INDEX "idx_opportunities_naics" ON "public"."opportunities" USING "gin" ("naics_codes");



CREATE INDEX "idx_opportunities_posted" ON "public"."opportunities" USING "btree" ("posted_date");



CREATE INDEX "idx_opportunities_status" ON "public"."opportunities" USING "btree" ("status");



CREATE INDEX "idx_opportunities_type" ON "public"."opportunities" USING "btree" ("opportunity_type");



CREATE INDEX "idx_organizations_primary_naics" ON "public"."organizations" USING "btree" ("primary_naics_code");



CREATE INDEX "idx_organizations_secondary_naics" ON "public"."organizations" USING "gin" ("secondary_naics_codes");



CREATE INDEX "idx_organizations_user_id" ON "public"."organizations" USING "btree" ("user_id");



CREATE INDEX "idx_performance_metrics_name_timestamp" ON "public"."performance_metrics" USING "btree" ("metric_name", "timestamp");



CREATE INDEX "idx_profiles_subscription" ON "public"."profiles" USING "btree" ("subscription_tier", "subscription_status");



CREATE INDEX "idx_rate_limits_key_created_at" ON "public"."rate_limits" USING "btree" ("key", "created_at");



CREATE INDEX "idx_user_analytics_event" ON "public"."user_analytics" USING "btree" ("event_type", "created_at");



CREATE INDEX "idx_user_analytics_user_id" ON "public"."user_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_user_events_user_timestamp" ON "public"."user_events" USING "btree" ("user_id", "timestamp");



CREATE OR REPLACE TRIGGER "update_applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_workflows_updated_at" BEFORE UPDATE ON "public"."application_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "workflow_step_advancement" BEFORE UPDATE ON "public"."application_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."advance_workflow_step"();



ALTER TABLE ONLY "public"."api_usage"
    ADD CONSTRAINT "api_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."application_workflows"
    ADD CONSTRAINT "application_workflows_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."form_sessions"
    ADD CONSTRAINT "form_sessions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_sessions"
    ADD CONSTRAINT "form_sessions_form_template_id_fkey" FOREIGN KEY ("form_template_id") REFERENCES "public"."form_templates"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."status_checks"
    ADD CONSTRAINT "status_checks_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_analytics"
    ADD CONSTRAINT "user_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view form templates" ON "public"."form_templates" FOR SELECT USING (true);



CREATE POLICY "Anyone can view opportunities" ON "public"."opportunities" FOR SELECT USING (true);



CREATE POLICY "Users can insert own applications" ON "public"."applications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own organizations" ON "public"."organizations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own applications" ON "public"."applications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own organizations" ON "public"."organizations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own applications" ON "public"."applications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own organizations" ON "public"."organizations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own workflows" ON "public"."application_workflows" FOR SELECT USING (("auth"."uid"() = ( SELECT "applications"."user_id"
   FROM "public"."applications"
  WHERE ("applications"."id" = "application_workflows"."application_id"))));



ALTER TABLE "public"."application_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status_checks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."advance_workflow_step"() TO "anon";
GRANT ALL ON FUNCTION "public"."advance_workflow_step"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."advance_workflow_step"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_monitoring_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_monitoring_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_monitoring_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_dashboard_analytics"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_dashboard_analytics"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_dashboard_analytics"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."agency_status_patterns" TO "anon";
GRANT ALL ON TABLE "public"."agency_status_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."agency_status_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."api_usage" TO "anon";
GRANT ALL ON TABLE "public"."api_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."api_usage" TO "service_role";



GRANT ALL ON TABLE "public"."application_workflows" TO "anon";
GRANT ALL ON TABLE "public"."application_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."application_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."commissions" TO "anon";
GRANT ALL ON TABLE "public"."commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."commissions" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."form_sessions" TO "anon";
GRANT ALL ON TABLE "public"."form_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."form_templates" TO "anon";
GRANT ALL ON TABLE "public"."form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."opportunities" TO "anon";
GRANT ALL ON TABLE "public"."opportunities" TO "authenticated";
GRANT ALL ON TABLE "public"."opportunities" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."platform_metrics" TO "anon";
GRANT ALL ON TABLE "public"."platform_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."status_checks" TO "anon";
GRANT ALL ON TABLE "public"."status_checks" TO "authenticated";
GRANT ALL ON TABLE "public"."status_checks" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."user_analytics" TO "anon";
GRANT ALL ON TABLE "public"."user_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."user_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_events" TO "anon";
GRANT ALL ON TABLE "public"."user_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_events" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
