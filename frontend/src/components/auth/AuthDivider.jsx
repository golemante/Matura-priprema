// features/auth/components/AuthDivider.jsx
export function AuthDivider({ text = "ili nastavi s" }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-warm-200" />
      <span className="text-xs text-warm-400 font-medium whitespace-nowrap">
        {text}
      </span>
      <div className="flex-1 h-px bg-warm-200" />
    </div>
  );
}
