
-- job_opportunities: remove old comp/entity, add new decision-tool columns
ALTER TABLE public.job_opportunities
  DROP COLUMN IF EXISTS direction,
  DROP COLUMN IF EXISTS base_salary_monthly_usd,
  DROP COLUMN IF EXISTS equity_offered,
  DROP COLUMN IF EXISTS entity_type;

ALTER TABLE public.job_opportunities
  ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'Dubai',
  ADD COLUMN IF NOT EXISTS opportunity_type text NOT NULL DEFAULT 'External role',
  ADD COLUMN IF NOT EXISTS net_annual_usd numeric,
  ADD COLUMN IF NOT EXISTS comp_notes text,
  ADD COLUMN IF NOT EXISTS living_cost_annual_usd numeric,
  ADD COLUMN IF NOT EXISTS equity_pct numeric,
  ADD COLUMN IF NOT EXISTS company_valuation_usd numeric,
  ADD COLUMN IF NOT EXISTS vesting_years numeric,
  ADD COLUMN IF NOT EXISTS vesting_type text DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS liq_pref_known boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS equity_confidence_pct numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS optionality_rating integer,
  ADD COLUMN IF NOT EXISTS domain_fit_rating integer,
  ADD COLUMN IF NOT EXISTS stability_rating integer,
  ADD COLUMN IF NOT EXISTS last_touched_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.job_opportunities
  DROP CONSTRAINT IF EXISTS job_opportunities_location_check,
  DROP CONSTRAINT IF EXISTS job_opportunities_opportunity_type_check,
  DROP CONSTRAINT IF EXISTS job_opportunities_vesting_type_check;

ALTER TABLE public.job_opportunities
  ADD CONSTRAINT job_opportunities_location_check
    CHECK (location IN ('Dubai','Hong Kong','Other')),
  ADD CONSTRAINT job_opportunities_opportunity_type_check
    CHECK (opportunity_type IN ('External role','Internal path','Equity/Partnership','Business venture')),
  ADD CONSTRAINT job_opportunities_vesting_type_check
    CHECK (vesting_type IN ('Time-based','KPI-gated','None','Unknown'));

-- job_search_settings: add $1M planner + weights + living-cost defaults
ALTER TABLE public.job_search_settings
  ADD COLUMN IF NOT EXISTS current_net_worth_usd numeric NOT NULL DEFAULT 55000,
  ADD COLUMN IF NOT EXISTS target_net_worth_usd numeric NOT NULL DEFAULT 1000000,
  ADD COLUMN IF NOT EXISTS assumed_annual_return_pct numeric NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_annual_savings_usd numeric NOT NULL DEFAULT 150000,
  ADD COLUMN IF NOT EXISTS equity_benchmark_usd numeric NOT NULL DEFAULT 250000,
  ADD COLUMN IF NOT EXISTS living_cost_dubai_usd numeric NOT NULL DEFAULT 60000,
  ADD COLUMN IF NOT EXISTS living_cost_hk_usd numeric NOT NULL DEFAULT 85000,
  ADD COLUMN IF NOT EXISTS living_cost_other_usd numeric NOT NULL DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS weight_comp numeric NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS weight_equity numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS weight_optionality numeric NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS weight_fit numeric NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS weight_risk numeric NOT NULL DEFAULT 10;

ALTER TABLE public.job_search_settings
  DROP COLUMN IF EXISTS weekly_target_posts;

-- weekly_activity: drop linkedin posts
ALTER TABLE public.weekly_activity
  DROP COLUMN IF EXISTS linkedin_posts;
