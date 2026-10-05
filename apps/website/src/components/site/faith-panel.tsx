export function FaithPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="church-faith-panel p-8 md:p-10"><p className="church-eyebrow">{label}</p><p className="my-10 whitespace-pre-line text-3xl font-semibold leading-relaxed md:text-4xl">{children}</p><span className="block h-px w-10 bg-primary-700/40" aria-hidden="true" /></div>;
}
