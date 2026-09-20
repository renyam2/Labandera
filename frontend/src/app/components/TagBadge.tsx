export default function TagBadge({ tag, accent = false }: { tag: string; accent?: boolean }) {
  return (
    <span
      className={`font-mono text-xs font-700 tracking-widest px-2 py-0.5 ${
        accent
          ? "bg-accent text-accent-foreground"
          : "bg-foreground text-background"
      }`}
    >
      {tag}
    </span>
  );
}
