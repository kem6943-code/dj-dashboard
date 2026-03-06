import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cojxzblihtpdbgmszyrc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvanh6YmxpaHRwZGJnbXN6eXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjkzNjEsImV4cCI6MjA4Nzc0NTM2MX0.5CHByqfPf-m3deSyUQYIKIZDp-NdLWjHiCgL8VkzSOw';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 고정 ID를 사용하여 하나의 문서만 업데이트/조회합니다 (1인용 싱글/글로벌 상태 공유)
const DOCUMENT_ID = 'global_dashboard_state';

// 클라우드 동기화 함수
export async function syncToCloud(data: any) {
    try {
        const { error } = await supabase
            .from('dashboard_data')
            .upsert({
                id: DOCUMENT_ID,
                data: data,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error('Error syncing to cloud:', error);
        }
    } catch (e) {
        console.error('Network error syncing to cloud:', e);
    }
}

export async function fetchFromCloud() {
    try {
        const { data, error } = await supabase
            .from('dashboard_data')
            .select('data')
            .eq('id', DOCUMENT_ID)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            console.error('Error fetching from cloud:', error);
            return null;
        }

        return data?.data || null;
    } catch (e) {
        console.error('Network error fetching from cloud:', e);
        return null;
    }
}

export const signIn = async (_email: string, _password: string): Promise<{ data: any; error: any }> => {
    return { data: null, error: new Error('Auth disabled') };
};

export const signOut = async () => {
    return;
};

export const getCurrentUser = async () => {
    return null;
};
