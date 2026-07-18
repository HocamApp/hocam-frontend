export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh-safe flex-col bg-black">{children}</div>
  );
}
