import { createClient } from '@supabase/supabase-js';

// User provided credentials
const supabaseUrl = 'https://rksczvidibdmpbsyvgus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrc2N6dmlkaWJkbXBic3l2Z3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjc4NjksImV4cCI6MjA4MDgwMzg2OX0.fCFqC-gjtFiWqxtIb-3mObNuoI9b35tihz9bSZsaj_c';

const isConfigured = supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_SUPABASE');

export const supabase = isConfigured 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;