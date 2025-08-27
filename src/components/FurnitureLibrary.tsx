import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sofa, Bed, Lamp, Home, Car } from "lucide-react";

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  dimensions: string;
  color: string;
}

const furnitureItems: FurnitureItem[] = [
  { id: "sofa", name: "3-Seat Sofa", category: "Living Room", icon: Sofa, dimensions: "84\" x 36\"", color: "bg-blue-100" },
  { id: "chair", name: "Armchair", category: "Living Room", icon: Sofa, dimensions: "32\" x 32\"", color: "bg-green-100" },
  { id: "coffee-table", name: "Coffee Table", category: "Living Room", icon: Home, dimensions: "48\" x 24\"", color: "bg-amber-100" },
  { id: "bed-queen", name: "Queen Bed", category: "Bedroom", icon: Bed, dimensions: "60\" x 80\"", color: "bg-purple-100" },
  { id: "bed-king", name: "King Bed", category: "Bedroom", icon: Bed, dimensions: "76\" x 80\"", color: "bg-purple-100" },
  { id: "nightstand", name: "Nightstand", category: "Bedroom", icon: Home, dimensions: "18\" x 16\"", color: "bg-rose-100" },
  { id: "dresser", name: "Dresser", category: "Bedroom", icon: Home, dimensions: "58\" x 18\"", color: "bg-rose-100" },
  { id: "dining-table", name: "Dining Table", category: "Dining", icon: Home, dimensions: "72\" x 36\"", color: "bg-orange-100" },
  { id: "desk", name: "Office Desk", category: "Office", icon: Home, dimensions: "60\" x 30\"", color: "bg-teal-100" },
  { id: "bookshelf", name: "Bookshelf", category: "Office", icon: Home, dimensions: "32\" x 12\"", color: "bg-teal-100" },
];

const categories = ["All", "Living Room", "Bedroom", "Dining", "Office"];

interface FurnitureLibraryProps {
  onFurnitureSelect: (item: FurnitureItem) => void;
}

export const FurnitureLibrary = ({ onFurnitureSelect }: FurnitureLibraryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredItems = furnitureItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="w-80 h-full shadow-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Furniture Library</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search furniture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Categories */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={activeCategory === category ? "default" : "secondary"}
                className="cursor-pointer text-xs"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Furniture Items */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="px-4 space-y-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center p-3 rounded-lg border border-border hover:border-primary hover:shadow-sm cursor-pointer transition-all duration-200 bg-background"
                onClick={() => onFurnitureSelect(item)}
              >
                <div className={`p-2 rounded-md ${item.color} mr-3`}>
                  <item.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.dimensions}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {item.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Upload Custom Photo */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  // Handle photo upload
                  console.log('Photo uploaded:', file.name);
                }
              };
              input.click();
            }}
          >
            Upload Custom Photo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};