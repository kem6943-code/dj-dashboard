import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 인증되지 않은 사용자는 로그인 페이지로 튕겨냄!
    return <Navigate to="/login" replace />;
  }

  // children이 있으면 렌더링하고, 아니면 Outlet 렌더링 (라우팅 중첩용)
  return children ? <>{children}</> : <Outlet />;
}
