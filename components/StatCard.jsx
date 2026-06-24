// A single metric card for the dashboard.
// Props: label (e.g. "Open tickets"), value, hint (small caption), icon (emoji).
export default function StatCard({ label, value, hint, icon }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <span aria-hidden className="text-xl">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}
