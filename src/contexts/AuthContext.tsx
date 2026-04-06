import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (id: string, pw: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 앱 로드 시 세션 스토리지 확인
    const session = sessionStorage.getItem('djt_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (id: string, pw: string) => {
    // Mock 딜레이
    await new Promise(resolve => setTimeout(resolve, 800));

    // 하드코딩 인증: ID가 admin이고 비밀번호가 1234일 때 성공
    if (id === 'admin' && pw === '1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('djt_auth', 'true');
      return { success: true };
    }
    return { success: false, error: '사번 또는 비밀번호를 다시 확인해주세요.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('djt_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
