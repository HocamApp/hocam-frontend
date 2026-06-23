import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="px-6 text-center">
        <h1 className="text-3xl font-bold text-black sm:text-4xl md:text-5xl">
          Hocam&apos;ınız nerede?
        </h1>
        <p className="mt-4 text-base text-gray-500 sm:text-lg">
          YKS için en iyi hocaları bul. Hemen başla.
        </p>

        <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-center">
          <div className="flex flex-1 flex-col items-center gap-3">
            <span className="text-sm font-medium uppercase tracking-wide text-black">
              Öğrenci
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-md border border-black px-6 py-2 text-sm font-medium text-black"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white"
              >
                Hesap Oluştur
              </Link>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center gap-3">
            <span className="text-sm font-medium uppercase tracking-wide text-black">
              Hoca
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-md border border-black px-6 py-2 text-sm font-medium text-black"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register?role=tutor"
                className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white"
              >
                Hesap Oluştur
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
