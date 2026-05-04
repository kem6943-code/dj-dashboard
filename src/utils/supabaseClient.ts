import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

const DOCUMENT_ID = 1;

export async function syncToCloud(data: any): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('dashboard_data')
            .upsert({
                id: DOCUMENT_ID,
                content: data,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error('Error syncing to cloud:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Network error syncing to cloud:', e);
        return false;
    }
}

export async function fetchFromCloud() {
    try {
        const { data, error } = await supabase
            .from('dashboard_data')
            .select('content')
            .eq('id', DOCUMENT_ID)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching from cloud:', error);
            return null;
        }

        return data?.content || null;
    } catch (e) {
        console.error('Network error fetching from cloud:', e);
        return null;
    }
}
