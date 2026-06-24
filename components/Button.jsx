// Reusable button with three variants.
//
// Exercise 3 & 5: tune the variant styles (colours) and the interaction
// states (hover / active / focus). The `focus-visible` ring is intentionally
// minimal — improving it is part of the accessibility exercise.
const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  ghost: "bg-transparent text-ink hover:bg-canvas border border-border",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export default function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
