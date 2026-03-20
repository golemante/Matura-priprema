export function SectionHeading({ label, title, subtitle }) {
  return (
    <div className="mb-8">
      {label && (
        <div className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-100 text-xs font-bold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
          {label}
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-warm-500 text-base leading-relaxed max-w-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
