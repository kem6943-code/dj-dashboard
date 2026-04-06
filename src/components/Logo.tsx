interface LogoProps {
    className?: string;
}

export function Logo({ className = "h-8 w-auto" }: LogoProps) {
    return (
        <img 
            src="/logo2.jpg" 
            alt="Dongjin Techwin" 
            className={`object-contain ${className}`}
            onError={(e) => {
                // fallback
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40"><rect width="100" height="40" fill="%23f1f5f9" rx="4"/><text x="10" y="25" font-family="sans-serif" font-size="12" fill="%2394a3b8">logo2.jpg</text></svg>';
            }}
        />
    );
}
