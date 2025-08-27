import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface PropertyPanelProps {
  selectedObject: any;
  onObjectUpdate: (properties: any) => void;
}

export const PropertyPanel = ({ selectedObject, onObjectUpdate }: PropertyPanelProps) => {
  const [properties, setProperties] = useState({
    width: selectedObject?.width || 100,
    height: selectedObject?.height || 100,
    x: selectedObject?.left || 0,
    y: selectedObject?.top || 0,
    rotation: selectedObject?.angle || 0,
    color: "#000000",
  });

  const handlePropertyChange = (key: string, value: any) => {
    const newProperties = { ...properties, [key]: value };
    setProperties(newProperties);
    onObjectUpdate(newProperties);
  };

  if (!selectedObject) {
    return (
      <Card className="w-80 shadow-panel">
        <CardHeader>
          <CardTitle className="text-lg">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Select an object to edit its properties
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80 shadow-panel">
      <CardHeader>
        <CardTitle className="text-lg">Properties</CardTitle>
        <Badge variant="outline" className="w-fit">
          {selectedObject.type || "Object"}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Position */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Position</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="x" className="text-xs text-muted-foreground">X</Label>
              <Input
                id="x"
                type="number"
                value={Math.round(properties.x)}
                onChange={(e) => handlePropertyChange("x", parseFloat(e.target.value))}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="y" className="text-xs text-muted-foreground">Y</Label>
              <Input
                id="y"
                type="number"
                value={Math.round(properties.y)}
                onChange={(e) => handlePropertyChange("y", parseFloat(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Dimensions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Dimensions</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="width" className="text-xs text-muted-foreground">Width</Label>
              <Input
                id="width"
                type="number"
                value={Math.round(properties.width)}
                onChange={(e) => handlePropertyChange("width", parseFloat(e.target.value))}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs text-muted-foreground">Height</Label>
              <Input
                id="height"
                type="number"
                value={Math.round(properties.height)}
                onChange={(e) => handlePropertyChange("height", parseFloat(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Rotation */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Rotation</Label>
          <div className="space-y-2">
            <Slider
              value={[properties.rotation]}
              onValueChange={(value) => handlePropertyChange("rotation", value[0])}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(properties.rotation)}°
            </div>
          </div>
        </div>

        <Separator />

        {/* Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Style</Label>
          <div>
            <Label htmlFor="color" className="text-xs text-muted-foreground">Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="color"
                type="color"
                value={properties.color}
                onChange={(e) => handlePropertyChange("color", e.target.value)}
                className="h-8 w-16 p-1"
              />
              <Input
                type="text"
                value={properties.color}
                onChange={(e) => handlePropertyChange("color", e.target.value)}
                className="h-8 flex-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              // Duplicate object
              console.log("Duplicate object");
            }}
          >
            Duplicate
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full"
            onClick={() => {
              // Delete object
              console.log("Delete object");
            }}
          >
            Delete Object
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};