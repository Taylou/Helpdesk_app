// Small circular avatar that shows a person's initials.
// Pass a `name` ("Jane Doe") and it derives "JD".
export default function Avatar({ name = "?", size = "md" }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand ${sizes[size]}`}
      aria-hidden
      title={name}
    >
      {initials}
    </span>
  );
}
