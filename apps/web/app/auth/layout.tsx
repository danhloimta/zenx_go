import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-100/60 px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-md flex-col">
        <Link href="/" className="mb-10 flex items-center gap-2 self-center font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">Z</span>
          ZENX GO
        </Link>
        {children}
      </div>
    </main>
  );
}
