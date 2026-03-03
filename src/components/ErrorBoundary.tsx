import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: '#050505',
                    color: '#ef4444',
                    fontFamily: 'sans-serif'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>🚨 치명적인 렌더링 오류 발생 (Crash)</h2>
                    <p style={{ color: '#a3a3a3', marginBottom: '24px' }}>대시보드를 불러오는 중 백그라운드에서 오류가 발생했습니다. 아래 내용을 캡처해서 전달해주세요.</p>
                    <div style={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '12px',
                        padding: '20px',
                        maxWidth: '800px',
                        width: '100%',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#fca5a5' }}>Error Message:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '14px', lineHeight: '1.5', fontFamily: 'monospace' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '12px', color: '#fca5a5' }}>Component Stack:</h3>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '13px', lineHeight: '1.5', color: '#737373', fontFamily: 'monospace' }}>
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
