import { useState, useRef } from "react";
import { FloorplanCanvas, FloorplanCanvasRef } from "@/components/FloorplanCanvas";
import { DesignToolbar } from "@/components/DesignToolbar";
import { FurnitureLibrary } from "@/components/FurnitureLibrary";
import { PropertyPanel } from "@/components/PropertyPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiagnosticOverlay } from "@/components/DiagnosticOverlay";
import { toast } from "sonner";

const Index = () => {
  const [activeTool, setActiveTool] = useState("select");
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const canvasRef = useRef<FloorplanCanvasRef>(null);

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    setSelectedObject(null);
  };

  const handleObjectSelect = (object: any) => {
    if (object === "select") {
      // Switch to select mode
      setActiveTool("select");
      setSelectedObject(null);
    } else {
      setSelectedObject(object);
    }
  };

  const handleObjectUpdate = (properties: any) => {
    if (selectedObject) {
      // Update the selected object with new properties
      console.log("Updating object:", properties);
    }
  };

  const handleFurnitureSelect = (item: any) => {
    // Just show a message for now, drag and drop is the main interaction
    toast(`Drag ${item.name} to the canvas to place it`);
  };

  const handleSave = () => {
    toast("Project saved successfully!");
  };

  const handleLoad = () => {
    toast("Loading project...");
  };

  const handleClear = () => {
    setSelectedObject(null);
    setActiveTool("select");
    canvasRef.current?.clearCanvas();
  };

  console.log("Index component rendering with activeTool:", activeTool);

  return (
    <ErrorBoundary componentName="Index">
      <div className="h-screen flex flex-col bg-background">
        <ErrorBoundary componentName="DesignToolbar">
          <DesignToolbar
            activeTool={activeTool}
            onToolChange={handleToolChange}
            onClear={handleClear}
            onSave={handleSave}
            onLoad={handleLoad}
          />
        </ErrorBoundary>
        
        <div className="flex flex-1 overflow-hidden">
          <ErrorBoundary componentName="FurnitureLibrary">
            <FurnitureLibrary onFurnitureSelect={handleFurnitureSelect} />
          </ErrorBoundary>
          
          <ErrorBoundary componentName="FloorplanCanvas">
            <div className="flex-1 p-4">
              <FloorplanCanvas
                ref={canvasRef}
                activeTool={activeTool}
                onObjectSelect={handleObjectSelect}
              />
            </div>
          </ErrorBoundary>
          
          <ErrorBoundary componentName="PropertyPanel">
            <PropertyPanel
              selectedObject={selectedObject}
              onObjectUpdate={handleObjectUpdate}
            />
          </ErrorBoundary>
        </div>
      </div>
      <DiagnosticOverlay />
    </ErrorBoundary>
  );
};

export default Index;
