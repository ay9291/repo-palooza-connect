import { ReactNode } from "react";

interface PageHeroProps {
  title: string;
  description: string;
  action?: ReactNode;
}

const PageHero = ({ title, description, action }: PageHeroProps) => {
  return (
    <section className="rounded-2xl border border-border/60 bg-gradient-to-r from-background via-background to-accent/10 p-6 md:p-8 mb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-muted-foreground max-w-2xl">{description}</p>
        </div>
        {action && <div>{action}</div>}
      </div>
    </section>
  );
};

export default PageHero;
