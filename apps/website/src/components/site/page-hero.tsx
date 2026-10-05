import { cn } from "@daegwang/web-ui/lib/utils";
import { sectionLabel } from './section-label';

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export function PageHero({ eyebrow, title, description, className }: PageHeroProps) {
  return (
    <section className={cn("church-page-hero border-b border-border py-12 md:py-16", className)}>
      <div className="container-site relative church-page-intro">
        <p className="church-eyebrow">{sectionLabel(eyebrow)}</p>
        <h1 className="text-balance mt-4 max-w-4xl text-3xl leading-[1.5] tracking-[-0.035em] md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="church-page-description mt-5 max-w-3xl text-lg leading-8 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
