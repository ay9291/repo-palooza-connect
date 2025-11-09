import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterState {
  priceRange: [number, number];
  materials: string[];
  colors: string[];
  inStockOnly: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const MATERIALS = ["Solid Wood", "Engineered Wood", "Particle Board", "MDF", "Plywood"];
const COLORS = ["Natural", "Walnut", "Cherry", "Oak", "White", "Black", "Brown"];

const AdvancedFilters = ({ filters, onFiltersChange }: AdvancedFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleMaterialToggle = (material: string) => {
    const newMaterials = localFilters.materials.includes(material)
      ? localFilters.materials.filter((m) => m !== material)
      : [...localFilters.materials, material];
    
    setLocalFilters({ ...localFilters, materials: newMaterials });
  };

  const handleColorToggle = (color: string) => {
    const newColors = localFilters.colors.includes(color)
      ? localFilters.colors.filter((c) => c !== color)
      : [...localFilters.colors, color];
    
    setLocalFilters({ ...localFilters, colors: newColors });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      priceRange: [0, 100000],
      materials: [],
      colors: [],
      inStockOnly: false,
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Products</SheetTitle>
          <SheetDescription>
            Refine your search with advanced filters
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Price Range */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Price Range</Label>
            <div className="space-y-4">
              <Slider
                value={localFilters.priceRange}
                onValueChange={(value) => 
                  setLocalFilters({ ...localFilters, priceRange: value as [number, number] })
                }
                max={100000}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{localFilters.priceRange[0].toLocaleString()}</span>
                <span>₹{localFilters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Material</Label>
            <div className="space-y-3">
              {MATERIALS.map((material) => (
                <div key={material} className="flex items-center space-x-2">
                  <Checkbox
                    id={`material-${material}`}
                    checked={localFilters.materials.includes(material)}
                    onCheckedChange={() => handleMaterialToggle(material)}
                  />
                  <label
                    htmlFor={`material-${material}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {material}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Color</Label>
            <div className="space-y-3">
              {COLORS.map((color) => (
                <div key={color} className="flex items-center space-x-2">
                  <Checkbox
                    id={`color-${color}`}
                    checked={localFilters.colors.includes(color)}
                    onCheckedChange={() => handleColorToggle(color)}
                  />
                  <label
                    htmlFor={`color-${color}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {color}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={localFilters.inStockOnly}
                onCheckedChange={(checked) => 
                  setLocalFilters({ ...localFilters, inStockOnly: checked as boolean })
                }
              />
              <label
                htmlFor="in-stock"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                In Stock Only
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button onClick={resetFilters} variant="outline" className="flex-1">
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilters;
