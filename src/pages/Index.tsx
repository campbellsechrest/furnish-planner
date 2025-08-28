import { useState, useRef, useEffect } from "react";
import { FloorplanCanvas, FloorplanCanvasRef } from "@/components/FloorplanCanvas";
import { DesignToolbar } from "@/components/DesignToolbar";
import { FurnitureLibrary } from "@/components/FurnitureLibrary";
import { PropertyPanel } from "@/components/PropertyPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FurnitureDetailsDialog } from "@/components/FurnitureDetailsDialog";
import { toast } from "sonner";

const Index = () => {
  const [activeTool, setActiveTool] = useState("select");
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedFurniture, setSelectedFurniture] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [furnitureDialogOpen, setFurnitureDialogOpen] = useState(false);
  const [furnitureForDialog, setFurnitureForDialog] = useState(null);
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

  const handleUndo = () => {
    canvasRef.current?.undo();
    updateUndoRedoState();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
    updateUndoRedoState();
  };

  const updateUndoRedoState = () => {
    setCanUndo(canvasRef.current?.canUndo() || false);
    setCanRedo(canvasRef.current?.canRedo() || false);
  };

  // Update undo/redo state periodically
  useEffect(() => {
    const interval = setInterval(updateUndoRedoState, 500);
    return () => clearInterval(interval);
  }, []);

  const handleFurnitureDoubleClick = (furniture: any) => {
    setFurnitureForDialog(furniture);
    setFurnitureDialogOpen(true);
  };

  const handleFurnitureNameUpdate = (newName: string) => {
    // This function will be called from the dialog to update the furniture name
    if (furnitureForDialog) {
      // Update the furniture text object and data
      if ((furnitureForDialog as any).furnitureText) {
        (furnitureForDialog as any).furnitureText.set({ text: newName });
        (furnitureForDialog as any).furnitureData.name = newName;
        
        // Force canvas to re-render to show the updated name
        const canvas = canvasRef.current;
        if (canvas) {
          // Trigger a re-render by temporarily setting the object as dirty
          (furnitureForDialog as any).furnitureText.dirty = true;
          toast(`Furniture name updated to: ${newName}`);
        }
      }
    }
  };

  const getFurnitureDimensions = () => {
    if (!furnitureForDialog) return { width: 0, height: 0 };
    
    // Get the actual canvas dimensions of the furniture
    const bounds = furnitureForDialog.getBoundingRect?.() || { width: 0, height: 0 };
    return { width: bounds.width, height: bounds.height };
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
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
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
                onFurnitureDoubleClick={handleFurnitureDoubleClick}
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

        <FurnitureDetailsDialog
          isOpen={furnitureDialogOpen}
          onClose={() => setFurnitureDialogOpen(false)}
          furniture={furnitureForDialog}
          onNameUpdate={handleFurnitureNameUpdate}
          canvasDimensions={getFurnitureDimensions()}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Index;
