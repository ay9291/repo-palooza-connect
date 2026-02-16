import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import PageHero from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import EnterpriseValueGrid from "@/features/commerce/components/EnterpriseValueGrid";
import SmartSearchPanel from "@/features/commerce/components/SmartSearchPanel";
import ComparisonDrawer, { ComparisonProduct } from "@/features/commerce/components/ComparisonDrawer";
import SectionHeading from "@/features/shared/components/SectionHeading";
import { buildPersonalizedRecommendations } from "@/features/commerce/modules/recommendation-engine";

const MOCK_PRODUCTS: ComparisonProduct[] = [
  { id: "p1", name: "Aurora Office Desk", price: 15999, rating: 4.8 },
  { id: "p2", name: "Regent Storage Cabinet", price: 18999, rating: 4.6 },
  { id: "p3", name: "Lumen Workstation", price: 20999, rating: 4.9 },
  { id: "p4", name: "Monarch Wall Unit", price: 27999, rating: 4.7 },
];

const EnterpriseExperience = () => {
  const [queryState, setQueryState] = useState({ query: "", sort: "relevance" as const });
  const [compareIds, setCompareIds] = useState<string[]>(["p1", "p3"]);

  const comparisonItems = useMemo(
    () => MOCK_PRODUCTS.filter((p) => compareIds.includes(p.id)),
    [compareIds],
  );

  const recommendations = useMemo(
    () => buildPersonalizedRecommendations(MOCK_PRODUCTS, compareIds),
    [compareIds],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <PageHero
          title="Enterprise Commerce Experience"
          description="A premium storefront blueprint with smart discovery, assisted decisions, and personalization."
          action={<Button onClick={() => setCompareIds(["p2", "p4"])}>Switch compare set</Button>}
        />

        <SmartSearchPanel state={queryState} onStateChange={setQueryState} />

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Platform"
            title="Enterprise capabilities"
            description="Designed for high-growth e-commerce teams with strict reliability and security requirements."
          />
          <EnterpriseValueGrid />
        </section>

        <section className="space-y-4">
          <SectionHeading title="Product comparison" />
          <ComparisonDrawer items={comparisonItems} />
        </section>

        <section className="space-y-3">
          <SectionHeading title="Personalized recommendations" />
          <div className="flex flex-wrap gap-2">
            {recommendations.map((item) => (
              <span key={item.id} className="px-3 py-1 rounded-full border text-sm">
                {item.name}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default EnterpriseExperience;
