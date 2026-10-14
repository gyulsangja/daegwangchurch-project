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
    <section className={cn("church-page-hero border-b border-border py-7 md:py-9", className)}>
      <div className="container-site relative church-page-intro">
        <p className="church-eyebrow">{sectionLabel(eyebrow)}</p>
        <h1 className="text-balance mt-4 max-w-4xl text-3xl leading-[1.5] tracking-[-0.035em] md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="church-page-description mt-3 max-w-3xl text-base leading-7 text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
