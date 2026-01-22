export interface SocialContact {
  id: string;
  user_id: string;
  name: string;
  instagram: string | null;
  circle: string;
  vibe_score: number;
  status: string;
  closeness: string;
  where_met: string | null;
  interesting_note: string | null;
  last_contacted: string | null;
  next_action: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialExperience {
  id: string;
  user_id: string;
  title: string;
  tier: 'Low' | 'Mid' | 'High';
  estimated_cost: number;
  ideal_group_size: string | null;
  description: string | null;
  location: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklySocialPlan {
  id: string;
  user_id: string;
  week_start: string;
  day_of_week: number;
  slot_type: 'mid_week' | 'weekend' | null;
  experience_id: string | null;
  custom_title: string | null;
  guest_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  experience?: SocialExperience;
}

export interface WeeklyOutreach {
  id: string;
  user_id: string;
  week_start: string;
  contact_id: string | null;
  contacted: boolean;
  confirmed_for: 'mid_week' | 'weekend' | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
  contact?: SocialContact;
}

export interface SundayOutreachTask {
  id: string;
  user_id: string;
  week_start: string;
  contact_id: string | null;
  outreach_type: 'Inner Circle' | 'New Leads' | 'Romantic';
  completed: boolean;
  created_at: string;
  updated_at: string;
  contact?: SocialContact;
}

export const DEFAULT_CLOSENESS_TAGS = [
  'Just Met',
  'Met Once', 
  'Acquaintance',
  'Friend',
  'Close Friend',
  'MyCrew'
] as const;

export const CLOSENESS_COLORS: Record<string, string> = {
  'Just Met': 'bg-slate-600',
  'Met Once': 'bg-slate-500',
  'Acquaintance': 'bg-blue-600',
  'Friend': 'bg-emerald-600',
  'Close Friend': 'bg-amber-600',
  'MyCrew': 'bg-amber-500',
};

export const TIERS = ['Low', 'Mid', 'High'] as const;

export const DEFAULT_EXPERIENCES: Omit<SocialExperience, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  // Tier 1: Low Cost
  { title: 'Kite Beach Sunset Walk', tier: 'Low', estimated_cost: 20, ideal_group_size: '1-2', description: 'Best for 1-on-1s with high-value guys or casual first meets', location: 'Kite Beach', is_default: true },
  { title: 'Alserkal Avenue Gallery Crawl', tier: 'Low', estimated_cost: 0, ideal_group_size: '2-4', description: 'Sophisticated, great for a "non-date" that feels cool and intellectual', location: 'Alserkal Avenue', is_default: true },
  { title: 'Board Game / No-Drink Night', tier: 'Low', estimated_cost: 100, ideal_group_size: '4-8', description: 'Hosting at your place without a full dinner. Low pressure, high interaction', location: 'Home', is_default: true },
  
  // Tier 2: Mid-Range
  { title: 'Padel at Matcha Club', tier: 'Mid', estimated_cost: 150, ideal_group_size: '4', description: 'The ultimate Dubai networking tool', location: 'Matcha Club, Al Quoz', is_default: true },
  { title: 'Topgolf Dubai', tier: 'Mid', estimated_cost: 200, ideal_group_size: '4-6', description: 'Great for groups of 6; very easy to mix "randoms" because the game is the focus', location: 'Topgolf Dubai', is_default: true },
  { title: 'Shooting Range', tier: 'Mid', estimated_cost: 300, ideal_group_size: '2-4', description: 'High-octane activity that attracts high-net-worth circles', location: 'Jebel Ali', is_default: true },
  
  // Tier 3: High / Producer Level
  { title: 'Curated Home Dinner', tier: 'High', estimated_cost: 750, ideal_group_size: '6-10', description: 'Gold standard for VIP networking. Use Mamazu or a private chef', location: 'Home', is_default: true },
  { title: 'Speakeasy Mocktail Round', tier: 'High', estimated_cost: 300, ideal_group_size: '4-6', description: 'Night out vibe without the alcohol', location: 'Galaxy Bar / The Library Bar', is_default: true },
  { title: 'Yacht Morning (Sober)', tier: 'High', estimated_cost: 2000, ideal_group_size: '6-8', description: '10 AM Wellness & Swim yacht - feels ultra-exclusive', location: 'Dubai Marina', is_default: true },
];
