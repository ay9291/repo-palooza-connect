interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

const SectionHeading = ({ eyebrow, title, description }: SectionHeadingProps) => {
  return (
    <div className="space-y-2">
      {eyebrow && <p className="text-xs uppercase tracking-[0.16em] text-accent">{eyebrow}</p>}
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
      {description && <p className="text-muted-foreground max-w-2xl">{description}</p>}
    </div>
  );
};

export default SectionHeading;
