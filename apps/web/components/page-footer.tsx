import Link from "next/link";

export function PageFooter({ app = false }: { app?: boolean }) {
  return (
    <footer className="border-t border-slate-100 bg-white px-6 py-5 text-xs text-slate-500 sm:px-8">
      <div
        className={
          app
            ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            : "mx-auto flex max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <span>© 2024 ZENX GO. All rights reserved.</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/terms" className="hover:text-[#00873E] transition-colors">
            Điều khoản sử dụng
          </Link>
          <Link href="/privacy" className="hover:text-[#00873E] transition-colors">
            Chính sách bảo mật
          </Link>
          <Link href="mailto:support@zenxgo.vn" className="hover:text-[#00873E] transition-colors">
            Liên hệ
          </Link>
          <Link href="mailto:support@zenxgo.vn" className="hover:text-[#00873E] transition-colors">
            Hỗ trợ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
