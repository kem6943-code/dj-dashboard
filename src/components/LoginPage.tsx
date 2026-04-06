import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock, Check } from 'lucide-react';
import { Logo } from './Logo';

export function LoginPage() {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await login(id, password);

        if (!result.success) {
            setError(result.error || '로그인에 실패했습니다.');
            setLoading(false);
        } else {
            navigate('/dashboard', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-[460px] transition-all duration-500 ease-out">
                {/* Login Card */}
                <div className="bg-white rounded-[24px] pt-10 px-10 pb-12 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
                    
                    {/* Logo Section - Top Left */}
                    <div className="flex justify-start mb-8">
                        <Logo className="h-10 w-auto max-w-[200px]" />
                    </div>

                    {/* Title Section - Center Aligned */}
                    <div className="text-center mb-10 pb-6 border-b border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">경영실적 대시보드</h2>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2 text-center">
                            <label className="text-[14px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                                <User size={15} className="text-slate-400" /> ID(이메일)
                            </label>
                            <input
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="w-full text-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                                placeholder="아이디를 입력하세요"
                                required
                            />
                        </div>

                        <div className="space-y-2 text-center">
                            <label className="text-[14px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                                <Lock size={15} className="text-slate-400" /> 비밀번호
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full text-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-[14px] font-medium py-3 px-3 rounded-xl border border-red-100 animate-head-shake text-center">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed text-[16px]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <LogIn size={18} className="transition-transform group-hover:translate-x-0.5" />
                                        로그인
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 flex justify-center">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                {rememberMe && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                            />
                            <span className="text-[14px] font-semibold text-slate-600 select-none">로그인 상태 유지</span>
                        </label>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-[13px] font-medium">
                        Copyright ⓒ 2026 Dongjin Techwin. All Rights Reserved.
                    </p>
                </div>
            </div>

            <style>{`
        @keyframes head-shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-head-shake {
          animation: head-shake 0.4s ease-in-out;
        }
      `}</style>
        </div>
    );
}
