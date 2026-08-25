import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#00873E] hover:underline">← Về trang chủ</Link>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Chính sách bảo mật</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Đây là trang thông tin của bản demo ZENX GO. Chính sách bảo mật chính thức cần được chủ sản phẩm phê duyệt trước khi phát hành công khai.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Không sử dụng dữ liệu demo cho giao dịch thật. Vui lòng không nhập thông tin thanh toán thật trong môi trường này.
        </div>
        <p className="mt-6 text-sm text-slate-600">Liên hệ về dữ liệu: <a className="font-semibold text-[#00873E] hover:underline" href="mailto:support@zenxgo.vn">support@zenxgo.vn</a>.</p>
      </article>
    </main>
  );
}
