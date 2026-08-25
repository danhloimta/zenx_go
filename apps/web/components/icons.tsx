export function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27a7.17 7.17 0 0 1 0-4.54V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function FacebookIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

export function MoMoLogo({ className = "size-8" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-[#A50064] text-white font-bold tracking-tighter text-[10px] select-none ${className}`}
    >
      <span className="leading-tight text-center">mo<br/>mo</span>
    </div>
  );
}

export function ZaloPayLogo({ className = "size-8" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-white border border-blue-100 text-[#0068FF] font-extrabold text-[10px] select-none ${className}`}
    >
      <span className="leading-tight text-center">Zalo<br/><span className="text-[#008FE5]">Pay</span></span>
    </div>
  );
}

export function VisaMastercardLogo({ className = "h-7" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="font-extrabold italic text-[#1A1F71] tracking-tighter text-sm">VISA</span>
      <div className="flex -space-x-1.5 items-center">
        <div className="size-3.5 rounded-full bg-[#EB001B] opacity-90" />
        <div className="size-3.5 rounded-full bg-[#F79E1B] opacity-90" />
      </div>
    </div>
  );
}

export function ZenxCoinGoldIcon({ className = "size-5" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#FCD34D] via-[#F59E0B] to-[#D97706] text-white font-black text-[11px] shadow-sm ring-1 ring-amber-400/40 select-none ${className}`}
    >
      Z
    </div>
  );
}

export function ZenxCoinGreenIcon({ className = "size-7" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-[#00873E] text-white font-bold text-xs shadow-sm select-none ${className}`}
    >
      Z
    </div>
  );
}
