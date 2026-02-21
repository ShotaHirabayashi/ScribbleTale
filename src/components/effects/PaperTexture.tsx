export function PaperTexture({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 mix-blend-multiply opacity-30 ${className}`}
      style={{
        filter: "url(#paper-texture)",
        background: "linear-gradient(135deg, transparent 0%, rgba(139, 115, 85, 0.05) 50%, transparent 100%)",
      }}
      aria-hidden="true"
    />
  )
}
