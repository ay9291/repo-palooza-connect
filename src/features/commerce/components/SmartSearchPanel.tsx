import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildSearchSummary } from "@/features/commerce/modules/search-query";

interface SearchQueryState {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating-desc";
}

interface SmartSearchPanelProps {
  state: SearchQueryState;
  onStateChange: (state: SearchQueryState) => void;
}

const SmartSearchPanel = ({ state, onStateChange }: SmartSearchPanelProps) => {
  return (
    <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
      <div className="space-y-2">
        <Label htmlFor="smart-search">Advanced Search</Label>
        <Input
          id="smart-search"
          placeholder="Search products, collections, styles..."
          value={state.query}
          onChange={(e) => onStateChange({ ...state, query: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">{buildSearchSummary(state)}</p>
    </div>
  );
};

export default SmartSearchPanel;
