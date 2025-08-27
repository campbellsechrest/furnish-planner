import { useState } from "react";
import { FloorplanCanvas } from "@/components/FloorplanCanvas";
import { DesignToolbar } from "@/components/DesignToolbar";
import { FurnitureLibrary } from "@/components/FurnitureLibrary";
import { PropertyPanel } from "@/components/PropertyPanel";
import { toast } from "sonner";

const Index = () => {
  const [activeTool, setActiveTool] = useState("select");
  const [selectedObject, setSelectedObject] = useState(null);

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    setSelectedObject(null);
  };

  const handleObjectSelect = (object: any) => {
    setSelectedObject(object);
  };

  const handleObjectUpdate = (properties: any) => {
    if (selectedObject) {
      // Update the selected object with new properties
      console.log("Updating object:", properties);
    }
  };

  const handleFurnitureSelect = (item: any) => {
    toast(`Selected ${item.name} - Click on canvas to place it`);
    setActiveTool("furniture");
  };

  const handleSave = () => {
    toast("Project saved successfully!");
  };

  const handleLoad = () => {
    toast("Loading project...");
  };

  const handleClear = () => {
    toast("Canvas cleared!");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <DesignToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onClear={handleClear}
        onSave={handleSave}
        onLoad={handleLoad}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <FurnitureLibrary onFurnitureSelect={handleFurnitureSelect} />
        
        <div className="flex-1 p-4">
          <FloorplanCanvas
            activeTool={activeTool}
            onObjectSelect={handleObjectSelect}
          />
        </div>
        
        <PropertyPanel
          selectedObject={selectedObject}
          onObjectUpdate={handleObjectUpdate}
        />
      </div>
    </div>
  );
};

export default Index;
