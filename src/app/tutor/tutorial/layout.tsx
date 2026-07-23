export default function TutorTutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen dark canvas, no navbar — mirrors the live-lesson layout in
  // src/app/session/[bookingId]/layout.tsx so the tutorial feels like the
  // real lesson screen.
  return <div className="flex h-dvh-safe flex-col bg-black">{children}</div>;
}
