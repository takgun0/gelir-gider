interface PlaceholderProps {
  title: string;
}

/** Faz 1 iskeleti: ekranlar sonraki fazlarda yazılır. */
export function Placeholder({ title }: PlaceholderProps) {
  return (
    <main className="mx-auto max-w-[640px] px-4 py-3">
      <h1 className="text-[22px] leading-7 font-semibold">{title}</h1>
    </main>
  );
}
