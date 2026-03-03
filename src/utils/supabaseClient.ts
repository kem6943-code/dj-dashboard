// 클라우드 동기화 함수 (현재 비활성 - 배포 확인 후 활성화 예정)
// Supabase 연결 없이 로컬 전용으로 먼저 돌립니다!

export async function syncToCloud(_data: any) {
    // 현재 비활성 - 로컬 저장만 사용
    return;
}

export async function fetchFromCloud() {
    // 현재 비활성 - 로컬 저장만 사용
    return null;
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
