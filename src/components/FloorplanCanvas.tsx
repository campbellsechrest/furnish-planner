import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Canvas as FabricCanvas, Rect, Line, Text, Group, IText } from "fabric";
import { toast } from "sonner";
import { ContextMenu } from "./ContextMenu";
import { useContextMenu } from "@/hooks/useContextMenu";

interface FloorplanCanvasProps {
  activeTool: string;
  onObjectSelect?: (object: any) => void;
}

export interface FloorplanCanvasRef {
  clearCanvas: () => void;
}

export const FloorplanCanvas = forwardRef<FloorplanCanvasRef, FloorplanCanvasProps>(({ activeTool, onObjectSelect }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [gridSize] = useState(20);
  const [majorGridSize] = useState(100);
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
  const [isEditingText, setIsEditingText] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [deleteButton, setDeleteButton] = useState<{ show: boolean; x: number; y: number }>({ 
    show: false, x: 0, y: 0 
  });
  const roomLabelsRef = useRef<Record<string, { width: Text; height: Text }>>({});

  const snapToGrid = (coordinate: number, gridSize: number = 20) => {
    return Math.round(coordinate / gridSize) * gridSize;
  };

  const addGridToCanvas = (canvas: FabricCanvas) => {
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Minor grid lines (every 20px)
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const isMainLine = i % majorGridSize === 0;
      const line = new Line([i, 0, i, canvasHeight], {
        stroke: isMainLine ? "#9ca3af" : "#d1d5db",
        strokeWidth: isMainLine ? 1 : 0.5,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        moveCursor: 'default',
      });
      canvas.add(line);
    }

    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const isMainLine = i % majorGridSize === 0;
      const line = new Line([0, i, canvasWidth, i], {
        stroke: isMainLine ? "#9ca3af" : "#d1d5db",
        strokeWidth: isMainLine ? 1 : 0.5,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        moveCursor: 'default',
      });
      canvas.add(line);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: "#fafafa",
      selection: true,
    });

    addGridToCanvas(canvas);
    setFabricCanvas(canvas);

    // Handle drag and drop - set up after canvas is created
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = "copy";
      console.log("Drag over canvas");
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      console.log("Drop event triggered");

      try {
        const furnitureData = e.dataTransfer?.getData("furniture");
        console.log("Furniture data:", furnitureData);
        if (!furnitureData) {
          console.log("No furniture data found");
          return;
        }

        const furniture = JSON.parse(furnitureData);
        const rect = canvas.wrapperEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

        // Create furniture directly here since canvas is available
        createFurnitureObjectOnCanvas(canvas, furniture, snappedX, snappedY);
      } catch (error) {
        console.error("Error dropping furniture:", error);
      }
    };

    // Enable drag and drop
    canvas.wrapperEl.addEventListener('dragover', handleDragOver);
    canvas.wrapperEl.addEventListener('drop', handleDrop);

    toast("Canvas ready! Start designing your floorplan.");

    return () => {
      canvas.wrapperEl?.removeEventListener('dragover', handleDragOver);
      canvas.wrapperEl?.removeEventListener('drop', handleDrop);
      canvas.dispose();
    };
  }, []);

  const createFurnitureObjectOnCanvas = (canvas: FabricCanvas, furniture: any, x: number, y: number) => {
    console.log("Creating furniture object:", furniture.name, "at", x, y);

    // Parse dimensions (e.g., "84\" x 36\"" -> width: 84, height: 36)
    const dimensions = furniture.dimensions.match(/(\d+).*?x.*?(\d+)/);
    const width = dimensions ? parseInt(dimensions[1]) : 60;
    const height = dimensions ? parseInt(dimensions[2]) : 40;

    // Create furniture rectangle
    const furnitureRect = new Rect({
      left: x,
      top: y,
      width: width,
      height: height,
      fill: getColorFromBg(furniture.color),
      stroke: "#1e40af",
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerColor: "#3b82f6",
      cornerSize: 8,
      transparentCorners: false,
    });

    // Create furniture label with inline editing
    const furnitureText = new IText(furniture.name, {
      left: x + width / 2,
      top: y + height / 2,
      fontSize: Math.min(width / 8, 14),
      fill: "#1e40af",
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
      selectable: false,
      editable: true,
      evented: false,
    });

    // Group furniture and text together
    const group = new Group([furnitureRect, furnitureText], {
      left: x,
      top: y,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerColor: "#3b82f6",
      cornerSize: 8,
      transparentCorners: false,
    });

    // Add custom properties
    (group as any).furnitureData = furniture;
    (group as any).furnitureText = furnitureText;

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();

    if (onObjectSelect) {
      onObjectSelect(group);
    }

    toast(`${furniture.name} added to canvas`);
  };

  // Legacy function for compatibility
  const createFurnitureObject = (furniture: any, x: number, y: number) => {
    if (!fabricCanvas) return;
    createFurnitureObjectOnCanvas(fabricCanvas, furniture, x, y);
  };

  const getColorFromBg = (bgColor: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-blue-100": "#dbeafe",
      "bg-green-100": "#dcfce7",
      "bg-amber-100": "#fef3c7",
      "bg-purple-100": "#f3e8ff",
      "bg-rose-100": "#ffe4e6",
      "bg-orange-100": "#ffedd5",
      "bg-teal-100": "#ccfbf1",
    };
    return colorMap[bgColor] || "#e5e7eb";
  };

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.selection = activeTool === "select";
    fabricCanvas.isDrawingMode = false;

    // Remove previous event listeners
    fabricCanvas.off("mouse:down");
    fabricCanvas.off("mouse:move");
    fabricCanvas.off("mouse:up");

    // Consolidate all mouse:down handlers to avoid conflicts
    fabricCanvas.on("mouse:down", (e) => {
      // Handle right-click and ctrl+click for context menu first
      if (e.e instanceof MouseEvent && (e.e.button === 2 || (e.e.ctrlKey && e.e.button === 0))) {
        e.e.preventDefault();
        if (e.target) {
          showContextMenu(e.e.clientX, e.e.clientY, e.target);
        }
        return;
      }

      // Handle canvas deselection
      if (!e.target && activeTool === "select") {
        fabricCanvas.discardActiveObject();
        setSelectedObject(null);
        setDeleteButton({ show: false, x: 0, y: 0 });
        fabricCanvas.renderAll();
        if (onObjectSelect) {
          onObjectSelect(null);
        }
        return;
      }

      // Handle tool-specific actions
      if (!e.pointer) return;

      if (activeTool === "wall") {
        console.log("Wall tool mouse down");
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);

        setIsDrawing(true);
        setStartPoint({ x: snappedX, y: snappedY });

        const wall = new Line([snappedX, snappedY, snappedX, snappedY], {
          stroke: "#ef4444",
          strokeWidth: 8,
          selectable: true,
        });
        fabricCanvas.add(wall);
        (fabricCanvas as any).currentWall = wall;
      } else if (activeTool === "room") {
        console.log("Room tool mouse down at:", e.pointer.x, e.pointer.y);
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);
        console.log("Snapped coordinates:", snappedX, snappedY);

        setIsDrawing(true);
        setStartPoint({ x: snappedX, y: snappedY });

        const room = new Rect({
          left: snappedX,
          top: snappedY,
          width: 0,
          height: 0,
          fill: "rgba(59, 130, 246, 0.1)",
          stroke: "#3b82f6",
          strokeWidth: 2,
          selectable: true,
        });
        
        // Assign temporary ID for dimension tracking during creation
        (room as any).id = `room_${Date.now()}`;
        
        fabricCanvas.add(room);
        console.log("Room rectangle created and added");
        
        // Send room to back layer and then select it
        const objects = fabricCanvas.getObjects();
        const roomIndex = objects.indexOf(room);
        if (roomIndex !== -1) {
          fabricCanvas.moveObjectTo(room, 0);
        }
        
        // Auto-select the room after creation
        fabricCanvas.setActiveObject(room);
        setSelectedObject(room);
        if (onObjectSelect) {
          onObjectSelect(room);
        }
        
        (fabricCanvas as any).currentRoom = room;
      } else if (activeTool === "dimension") {
        console.log("Dimension tool mouse down");
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);

        const currentStart = (fabricCanvas as any).dimensionStart;
        if (!currentStart) {
          (fabricCanvas as any).dimensionStart = { x: snappedX, y: snappedY };
          toast("Click second point to create dimension");
        } else {
          addDimension(currentStart.x, currentStart.y, snappedX, snappedY);
          (fabricCanvas as any).dimensionStart = null;
          toast("Dimension added");
        }
      }
    });

    // Consolidate all mouse:move handlers
    fabricCanvas.on("mouse:move", (e) => {
      if (!isDrawing || !e.pointer) return;

      if (activeTool === "wall") {
        const wall = (fabricCanvas as any).currentWall;
        if (wall) {
          const snappedX = snapToGrid(e.pointer.x);
          const snappedY = snapToGrid(e.pointer.y);
          
          wall.set({
            x2: snappedX,
            y2: snappedY,
          });
          fabricCanvas.renderAll();
        }
      } else if (activeTool === "room") {
        const room = (fabricCanvas as any).currentRoom;
        if (room && startPoint) {
          console.log("Room mouse move:", e.pointer.x, e.pointer.y);
          const snappedX = snapToGrid(e.pointer.x);
          const snappedY = snapToGrid(e.pointer.y);

          const width = snappedX - startPoint.x;
          const height = snappedY - startPoint.y;

          room.set({
            width: Math.abs(width),
            height: Math.abs(height),
            left: width < 0 ? snappedX : startPoint.x,
            top: height < 0 ? snappedY : startPoint.y,
          });
          
          fabricCanvas.renderAll();
          updateRoomDimensions(room, startPoint, { x: snappedX, y: snappedY });
        }
      }
    });

    // Consolidate all mouse:up handlers
    fabricCanvas.on("mouse:up", () => {
      if (activeTool === "wall") {
        console.log("Wall mouse up");
        (fabricCanvas as any).currentWall = null;
      } else if (activeTool === "room") {
        console.log("Room mouse up");
        const room = (fabricCanvas as any).currentRoom;
        if (room && startPoint) {
          // Assign unique ID to room for persistent dimension tracking
          (room as any).id = (room as any).id || `room_${Date.now()}`;
          finalizeRoomDimensions(room);
        }
        (fabricCanvas as any).currentRoom = null;
        console.log("Room drawing completed");
      }
      
      setIsDrawing(false);
      setStartPoint(null);
    });

    // Handle double-click for inline text editing
    fabricCanvas.on("mouse:dblclick", (e) => {
      if (e.target && (e.target as any).furnitureText) {
        const group = e.target;
        const textObject = (group as any).furnitureText;
        
        // Make text editable
        textObject.set({
          selectable: true,
          editable: true,
          evented: true,
        });
        
        // Ungroup temporarily for editing
        const objects = (group as any)._objects;
        fabricCanvas.remove(group);
        objects.forEach((obj: any) => fabricCanvas.add(obj));
        
        fabricCanvas.setActiveObject(textObject);
        textObject.enterEditing();
        setIsEditingText(true);
        
        // Handle text editing completion
        textObject.on('editing:exited', () => {
          setIsEditingText(false);
          // Regroup objects
          const rect = objects[0];
          textObject.set({
            selectable: false,
            editable: false,
            evented: false,
          });
          
          const newGroup = new Group([rect, textObject], {
            left: rect.left,
            top: rect.top,
            selectable: true,
            hasControls: true,
            hasBorders: true,
            cornerColor: "#3b82f6",
            cornerSize: 8,
            transparentCorners: false,
          });
          
          (newGroup as any).furnitureText = textObject;
          (newGroup as any).furnitureData = (group as any).furnitureData;
          
          fabricCanvas.remove(rect);
          fabricCanvas.remove(textObject);
          fabricCanvas.add(newGroup);
          fabricCanvas.setActiveObject(newGroup);
          fabricCanvas.renderAll();
          
          toast("Text updated");
        });
      }
    });

    // Object selection events
    fabricCanvas.on("selection:created", (e) => {
      if (onObjectSelect && e.selected) {
        const obj = e.selected[0];
        setSelectedObject(obj);
        onObjectSelect(obj);
        updateDeleteButtonPosition(obj);
      }
    });

    fabricCanvas.on("selection:updated", (e) => {
      if (onObjectSelect && e.selected) {
        const obj = e.selected[0];
        setSelectedObject(obj);
        onObjectSelect(obj);
        updateDeleteButtonPosition(obj);
      }
    });

    fabricCanvas.on("selection:cleared", () => {
      setSelectedObject(null);
      setDeleteButton({ show: false, x: 0, y: 0 });
      if (onObjectSelect) {
        onObjectSelect(null);
      }
    });

    // Handle object movement and scaling to update dimensions
    fabricCanvas.on("object:moving", (e) => {
      if (e.target === selectedObject) {
        updateDeleteButtonPosition(e.target);
      }
      // Update room dimensions when room is moved
      if ((e.target as any).id && (e.target as any).id.startsWith('room_')) {
        updatePersistentRoomDimensions(e.target);
      }
    });

    fabricCanvas.on("object:scaling", (e) => {
      // Update room dimensions when room is scaled
      if ((e.target as any).id && (e.target as any).id.startsWith('room_')) {
        updatePersistentRoomDimensions(e.target);
      }
    });

    fabricCanvas.on("object:modified", (e) => {
      // Update room dimensions when room modification is complete
      if ((e.target as any).id && (e.target as any).id.startsWith('room_')) {
        updatePersistentRoomDimensions(e.target);
      }
    });

    // Handle mouse over/out for delete button visibility
    fabricCanvas.on("mouse:over", (e) => {
      if (e.target === selectedObject) {
        updateDeleteButtonPosition(e.target);
      }
    });

  }, [activeTool, fabricCanvas, isDrawing, startPoint, onObjectSelect, selectedObject]);

  // Room dimension functions - ensure only one label per dimension
  const updateRoomDimensions = (room: Rect, start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (!fabricCanvas) return;
    
    const roomId = (room as any).id;
    if (!roomId) return;
    
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    
    // Convert pixels to feet (20px = 1 foot)
    const widthFeet = Math.round(width / 20 * 10) / 10;
    const heightFeet = Math.round(height / 20 * 10) / 10;
    
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    
    // Only update/create labels if room has meaningful size
    if (width > 10 && height > 10) {
      createRoomDimensionLabels(roomId, left, top, width, height, widthFeet, heightFeet);
    }
  };

  const updatePersistentRoomDimensions = (room: any) => {
    if (!fabricCanvas || !room.id) return;
    
    // Get current room bounds
    const bounds = room.getBoundingRect();
    const widthFeet = Math.round(bounds.width / 20 * 10) / 10;
    const heightFeet = Math.round(bounds.height / 20 * 10) / 10;
    
    // Only create/update labels if room has meaningful size
    if (bounds.width > 10 && bounds.height > 10) {
      createRoomDimensionLabels(room.id, bounds.left, bounds.top, bounds.width, bounds.height, widthFeet, heightFeet);
      fabricCanvas.renderAll();
    }
  };

  // Helper function to remove all dimension labels for a specific room
  const removeRoomDimensionLabels = (roomId: string) => {
    if (!fabricCanvas) return;

    const existing = roomLabelsRef.current[roomId];
    if (existing) {
      fabricCanvas.remove(existing.width);
      fabricCanvas.remove(existing.height);
      delete roomLabelsRef.current[roomId];
      return;
    }
    
    const labelsToRemove = fabricCanvas.getObjects().filter((obj: any) => 
      obj.isDimensionLabel && obj.roomId === roomId
    );
    labelsToRemove.forEach((label: any) => fabricCanvas.remove(label));
  };

  const createRoomDimensionLabels = (roomId: string, left: number, top: number, width: number, height: number, widthFeet: number, heightFeet: number) => {
    if (!fabricCanvas) return;
    
    const existing = roomLabelsRef.current[roomId];

    if (existing) {
      // Update existing labels positions and text
      existing.width.set({
        left: left + width / 2,
        top: top + height + 15,
        text: `${widthFeet}'`,
      } as any);
      existing.height.set({
        left: left + width + 15,
        top: top + height / 2,
        text: `${heightFeet}'`,
      } as any);
      fabricCanvas.renderAll();
      return;
    }

    // Create width label (bottom center)
    const widthLabel = new Text(`${widthFeet}'`, {
      left: left + width / 2,
      top: top + height + 15,
      fontSize: 12,
      fill: "#3b82f6",
      fontFamily: "Arial",
      fontWeight: "bold",
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: 3,
    });
    (widthLabel as any).isDimensionLabel = true;
    (widthLabel as any).roomId = roomId;
    (widthLabel as any).dimensionType = "width";
    
    // Create height label (right center)
    const heightLabel = new Text(`${heightFeet}'`, {
      left: left + width + 15,
      top: top + height / 2,
      fontSize: 12,
      fill: "#3b82f6",
      fontFamily: "Arial",
      fontWeight: "bold",
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: 3,
    });
    (heightLabel as any).isDimensionLabel = true;
    (heightLabel as any).roomId = roomId;
    (heightLabel as any).dimensionType = "height";

    roomLabelsRef.current[roomId] = { width: widthLabel, height: heightLabel };

    fabricCanvas.add(widthLabel);
    fabricCanvas.add(heightLabel);
  };

  const finalizeRoomDimensions = (room: Rect) => {
    // Ensure final cleanup and single label creation
    const roomId = (room as any).id;
    if (roomId) {
      // Force a final update to ensure clean labels
      setTimeout(() => updatePersistentRoomDimensions(room), 10);
    }
    toast("Room created with dimensions");
  };

  // Delete button position update
  const updateDeleteButtonPosition = (obj: any) => {
    if (!obj || !fabricCanvas) return;
    
    const objBounds = obj.getBoundingRect();
    const canvasEl = fabricCanvas.wrapperEl;
    const canvasRect = canvasEl.getBoundingClientRect();
    
    setDeleteButton({
      show: true,
      x: canvasRect.left + objBounds.left + objBounds.width - 10,
      y: canvasRect.top + objBounds.top - 10,
    });
  };

  // Handle object deletion
  const handleDeleteObject = () => {
    if (selectedObject && fabricCanvas) {
      // Remove associated dimension labels if it's a room
      if ((selectedObject as any).id && (selectedObject as any).id.startsWith('room_')) {
        removeRoomDimensionLabels((selectedObject as any).id);
      }
      
      fabricCanvas.remove(selectedObject);
      fabricCanvas.discardActiveObject();
      setSelectedObject(null);
      setDeleteButton({ show: false, x: 0, y: 0 });
      fabricCanvas.renderAll();
      
      if (onObjectSelect) {
        onObjectSelect(null);
      }
      
      toast("Object deleted");
    }
  };

  // Context menu handlers
  const handleBringToFront = () => {
    if (contextMenu.target && fabricCanvas) {
      fabricCanvas.bringObjectToFront(contextMenu.target);
      fabricCanvas.renderAll();
      toast("Brought to front");
    }
  };

  const handleSendToBack = () => {
    if (contextMenu.target && fabricCanvas) {
      fabricCanvas.sendObjectToBack(contextMenu.target);
      fabricCanvas.renderAll();
      toast("Sent to back");
    }
  };

  const addDimension = (x1: number, y1: number, x2: number, y2: number) => {
    if (!fabricCanvas) return;

    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const feet = Math.round(distance / 20 * 10) / 10; // Convert pixels to feet (rough)

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const dimensionLine = new Line([x1, y1, x2, y2], {
      stroke: "hsl(var(--dimension-line))",
      strokeWidth: 2,
      selectable: false,
    });

    const dimensionText = new Text(`${feet}'`, {
      left: midX,
      top: midY - 10,
      fontSize: 12,
      fill: "hsl(var(--dimension-line))",
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
      selectable: false,
    });

    fabricCanvas.add(dimensionLine);
    fabricCanvas.add(dimensionText);
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#fafafa";
    addGridToCanvas(fabricCanvas);
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  // Expose clearCanvas function to parent component
  useImperativeHandle(ref, () => ({
    clearCanvas
  }));

  return (
    <>
      <div className="flex-1 bg-canvas-bg border border-border rounded-lg overflow-hidden shadow-lg">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      {/* Delete button */}
      {deleteButton.show && (
        <button
          className="fixed z-50 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-colors"
          style={{
            left: deleteButton.x,
            top: deleteButton.y,
          }}
          onClick={handleDeleteObject}
          onMouseDown={(e) => e.stopPropagation()}
        >
          ×
        </button>
      )}
      
      <ContextMenu
        isVisible={contextMenu.isVisible}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={hideContextMenu}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />
    </>
  );
});