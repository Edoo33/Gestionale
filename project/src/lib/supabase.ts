import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Client = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  occupants: number | null;
  min_sqm: number | null;
  max_sqm: number | null;
  budget_min: number | null;
  budget_max: number | null;
  interested_property_type: string | null;
  interested_property_id: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type Property = {
  id: string;
  user_id: string;
  title: string;
  property_type: string;
  address: string | null;
  city: string | null;
  sqm: number | null;
  rooms: number | null;
  bathrooms: number | null;
  listing_type: string;
  price: number | null;
  monthly_price: number | null;
  status: string;
  description: string | null;
  created_at: string;
};

export type Seller = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  property_type: string | null;
  property_address: string | null;
  property_city: string | null;
  property_sqm: number | null;
  asking_price: number | null;
  notes: string | null;
  status: string;
  reminder_interval_days: number | null;
  reminder_enabled: boolean;
  last_contacted_at: string | null;
  next_reminder_date: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  client_id: string | null;
  property_id: string | null;
  title: string;
  date: string;
  duration_minutes: number | null;
  location: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};
