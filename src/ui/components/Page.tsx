import type { ReactNode } from 'react';

/** Sayfa kabı: mobilde 16 px yan boşluk; ikon şeridinde en fazla 640 px; masaüstünde en fazla 1120 px. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="px-4 pt-3 sm:px-6 lg:px-[60px] lg:pt-7">
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 lg:max-w-[1120px]">
        {children}
      </div>
    </main>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="m-0 text-[22px] leading-7 font-semibold">{children}</h1>;
}
