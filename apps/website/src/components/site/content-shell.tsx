import { cn } from "@daegwang/web-ui/lib/utils";
import { sectionLabel } from './section-label';

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
        "church-content container-site py-12 md:py-20",
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
        <p className="church-eyebrow">{sectionLabel(eyebrow)}</p>
      ) : null}
      <h2 className="church-section-title text-balance mt-3 text-3xl leading-[1.5] tracking-[-0.035em] md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-lg leading-8 text-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
