import { createClient } from '@supabase/supabase-js';

// User provided credentials
const supabaseUrl = 'https://rksczvidibdmpbsyvgus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrc2N6dmlkaWJkbXBic3l2Z3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjc4NjksImV4cCI6MjA4MDgwMzg2OX0.fCFqC-gjtFiWqxtIb-3mObNuoI9b35tihz9bSZsaj_c';

const isConfigured = supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_SUPABASE');

export const supabase = isConfigured 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

export const testConnection = async () => {
    if (!supabase) return { success: false, message: 'Supabase client is not configured (missing URL or Key).' };
    
    try {
        const start = Date.now();
        // Simply try to get session or select from a likely table to test connectivity
        // Using 'books' as it's the main table. If schema is missing, this errors (which is good info).
        const { error } = await supabase.from('books').select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error("Supabase connection test error:", error);
            // If table doesn't exist, it's still a connection success (404/42P01), but schema failure.
            return { 
                success: false, 
                message: `Connected to server, but query failed: ${error.message} (Code: ${error.code})` 
            };
        }
        
        const latency = Date.now() - start;
        return { success: true, message: `Connected successfully (${latency}ms).` };
    } catch (err: any) {
        console.error("Supabase connection unexpected error:", err);
        return { success: false, message: `Connection failed: ${err.message}` };
    }
};