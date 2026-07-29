import { cn } from "@/lib/utils";

export function ContentShell({
  children,
  className,
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "container-site py-16 md:py-24",
        narrow && "max-w-[54rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-bold tracking-[0.12em] text-primary-700">{eyebrow}</p>
      ) : null}
      <h2 className="text-balance mt-2 text-3xl font-extrabold tracking-[-0.045em] md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-lg leading-8 text-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
