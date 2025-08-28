import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface FurnitureDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  furniture: any;
  onNameUpdate: (newName: string) => void;
  canvasDimensions: { width: number; height: number };
}

export const FurnitureDetailsDialog = ({ 
  isOpen, 
  onClose, 
  furniture, 
  onNameUpdate,
  canvasDimensions 
}: FurnitureDetailsDialogProps) => {
  const [editableName, setEditableName] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Sample images for the gallery - in a real app, these would come from the furniture data
  const sampleImages = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ];

  useEffect(() => {
    if (furniture?.furnitureData?.name) {
      setEditableName(furniture.furnitureData.name);
    }
  }, [furniture]);

  const handleSaveName = () => {
    if (editableName.trim()) {
      onNameUpdate(editableName.trim());
      toast("Furniture name updated successfully");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    }
  };

  if (!furniture?.furnitureData) return null;

  // Convert canvas pixels to feet (20px = 1 foot)
  const widthFeet = Math.round((canvasDimensions.width / 20) * 10) / 10;
  const heightFeet = Math.round((canvasDimensions.height / 20) * 10) / 10;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Furniture Details</DialogTitle>
          <DialogDescription>
            Edit furniture properties and view detailed information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Editable Name Section */}
          <div className="space-y-2">
            <Label htmlFor="furniture-name">Furniture Name</Label>
            <div className="flex gap-2">
              <Input
                id="furniture-name"
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter furniture name"
              />
              <Button onClick={handleSaveName} size="sm">
                Save
              </Button>
            </div>
          </div>

          {/* Image Gallery Section */}
          <div className="space-y-3">
            <Label>Image Gallery</Label>
            <Card>
              <CardContent className="p-4">
                {/* Main Image Display */}
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <img
                    src={sampleImages[selectedImageIndex]}
                    alt={`${furniture.furnitureData.name} view ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="flex gap-2 justify-center">
                  {sampleImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-16 h-16 rounded-lg border-2 overflow-hidden ${
                        selectedImageIndex === index 
                          ? 'border-primary' 
                          : 'border-muted-foreground/20'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${furniture.furnitureData.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dimensions Section */}
          <div className="space-y-3">
            <Label>Canvas Dimensions</Label>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Width</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {widthFeet}'
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({canvasDimensions.width}px)
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Height</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {heightFeet}'
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({canvasDimensions.height}px)
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Original Furniture Dimensions */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Original Dimensions</div>
                  <Badge variant="secondary">
                    {furniture.furnitureData.dimensions}
                  </Badge>
                </div>
                
                {/* Category */}
                <div className="mt-3">
                  <div className="text-sm text-muted-foreground mb-2">Category</div>
                  <Badge>
                    {furniture.furnitureData.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};