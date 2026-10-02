import { cn } from "@daegwang/web-ui/lib/utils";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export function PageHero({ eyebrow, title, description, className }: PageHeroProps) {
  return (
    <section className={cn("border-b border-border bg-background-warm py-16 md:py-24", className)}>
      <div className="container-site">
        <p className="text-sm font-bold tracking-[0.12em] text-primary-700">{eyebrow}</p>
        <h1 className="text-balance mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-[-0.05em] md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-3xl text-lg leading-8 text-text-secondary md:text-xl">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
