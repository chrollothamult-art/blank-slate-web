import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDown, Filter, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface FilterState {
  categories: string[];
  minRating: number;
  priceRange: [number, number];
  formats: string[];
}

interface BookFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
  activeFilterCount: number;
}

const formatOptions = [
  { value: "ebook", label: "E-Book" },
  { value: "paperback", label: "Paperback" },
  { value: "hardcover", label: "Hardcover" },
];

const ratingOptions = [
  { value: 4, label: "4+ Stars" },
  { value: 3, label: "3+ Stars" },
  { value: 2, label: "2+ Stars" },
  { value: 0, label: "All Ratings" },
];

export const BookFilters = ({
  filters,
  onFiltersChange,
  onClearAll,
  activeFilterCount,
}: BookFiltersProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    rating: true,
    format: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("books")
      .select("category")
      .eq("status", "active");

    if (data) {
      const uniqueCategories = [...new Set(data.map((b) => b.category))].sort();
      setCategories(uniqueCategories);
    }
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleFormatToggle = (format: string) => {
    const newFormats = filters.formats.includes(format)
      ? filters.formats.filter((f) => f !== format)
      : [...filters.formats, format];
    onFiltersChange({ ...filters, formats: newFormats });
  };

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({ ...filters, minRating: rating });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
          </span>
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        </div>
      )}

      {/* Category Filter */}
      <Collapsible open={openSections.category} onOpenChange={() => toggleSection("category")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <span className="font-medium">Category</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.category ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label
                htmlFor={`category-${category}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Price Range Filter */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection("price")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <span className="font-medium">Price Range</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.price ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 px-1">
          <Slider
            value={[filters.priceRange[0], filters.priceRange[1]]}
            onValueChange={handlePriceChange}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Rating Filter */}
      <Collapsible open={openSections.rating} onOpenChange={() => toggleSection("rating")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <span className="font-medium">Minimum Rating</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.rating ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {ratingOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${option.value}`}
                checked={filters.minRating === option.value}
                onCheckedChange={() => handleRatingChange(option.value)}
              />
              <Label
                htmlFor={`rating-${option.value}`}
                className="text-sm font-normal cursor-pointer flex items-center gap-1"
              >
                {option.value > 0 && (
                  <div className="flex">
                    {Array.from({ length: option.value }, (_, i) => (
                      <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                    ))}
                  </div>
                )}
                <span>{option.label}</span>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Format Filter */}
      <Collapsible open={openSections.format} onOpenChange={() => toggleSection("format")}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <span className="font-medium">Format</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${openSections.format ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {formatOptions.map((format) => (
            <div key={format.value} className="flex items-center space-x-2">
              <Checkbox
                id={`format-${format.value}`}
                checked={filters.formats.includes(format.value)}
                onCheckedChange={() => handleFormatToggle(format.value)}
              />
              <Label
                htmlFor={`format-${format.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {format.label}
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-card p-6 border">
          <h3 className="font-playfair text-lg font-semibold mb-4">Filters</h3>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="font-playfair">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

// Active filter badges component
export const ActiveFilters = ({
  filters,
  onFiltersChange,
  onClearAll,
}: {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAll: () => void;
}) => {
  const activeFilters: { type: string; value: string; onRemove: () => void }[] = [];

  filters.categories.forEach((cat) => {
    activeFilters.push({
      type: "category",
      value: cat,
      onRemove: () =>
        onFiltersChange({
          ...filters,
          categories: filters.categories.filter((c) => c !== cat),
        }),
    });
  });

  if (filters.minRating > 0) {
    activeFilters.push({
      type: "rating",
      value: `${filters.minRating}+ Stars`,
      onRemove: () => onFiltersChange({ ...filters, minRating: 0 }),
    });
  }

  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50) {
    activeFilters.push({
      type: "price",
      value: `$${filters.priceRange[0]} - $${filters.priceRange[1]}`,
      onRemove: () => onFiltersChange({ ...filters, priceRange: [0, 50] }),
    });
  }

  filters.formats.forEach((format) => {
    activeFilters.push({
      type: "format",
      value: format.charAt(0).toUpperCase() + format.slice(1),
      onRemove: () =>
        onFiltersChange({
          ...filters,
          formats: filters.formats.filter((f) => f !== format),
        }),
    });
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${filter.value}-${index}`}
          variant="secondary"
          className="pl-2 pr-1 py-1 gap-1"
        >
          {filter.value}
          <button
            onClick={filter.onRemove}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs">
        Clear all
      </Button>
    </div>
  );
};
