import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#00873E] hover:underline">← Về trang chủ</Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Điều khoản sử dụng</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Đây là trang thông tin của bản demo ZENX GO. Nội dung điều khoản pháp lý chính thức cần được chủ sản phẩm phê duyệt trước khi phát hành công khai.
        </p>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Trong bản demo, thanh toán và callback chỉ được mô phỏng; không phát sinh giao dịch tiền thật.
        </div>
        <p className="mt-6 text-sm text-slate-600">Liên hệ cập nhật tài liệu: <a className="font-semibold text-[#00873E] hover:underline" href="mailto:support@zenxgo.vn">support@zenxgo.vn</a>.</p>
      </article>
    </main>
  );
}
