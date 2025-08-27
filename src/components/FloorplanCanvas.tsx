import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Canvas as FabricCanvas, Rect, Line, Text, Group } from "fabric";
import { toast } from "sonner";

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

    // Enable drag and drop
    canvas.wrapperEl.addEventListener('dragover', handleDragOver);
    canvas.wrapperEl.addEventListener('drop', handleDrop);

    addGridToCanvas(canvas);

    setFabricCanvas(canvas);
    toast("Canvas ready! Start designing your floorplan.");

    return () => {
      canvas.wrapperEl?.removeEventListener('dragover', handleDragOver);
      canvas.wrapperEl?.removeEventListener('drop', handleDrop);
      canvas.dispose();
    };
  }, []);

  // Handle drag and drop
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (!fabricCanvas) return;

    try {
      const furnitureData = e.dataTransfer?.getData("furniture");
      if (!furnitureData) return;

      const furniture = JSON.parse(furnitureData);
      const rect = fabricCanvas.wrapperEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const snappedX = snapToGrid(x);
      const snappedY = snapToGrid(y);

      createFurnitureObject(furniture, snappedX, snappedY);
    } catch (error) {
      console.error("Error dropping furniture:", error);
    }
  };

  const createFurnitureObject = (furniture: any, x: number, y: number) => {
    if (!fabricCanvas) return;

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

    // Create furniture label
    const furnitureText = new Text(furniture.name, {
      left: x + width / 2,
      top: y + height / 2,
      fontSize: Math.min(width / 8, 14),
      fill: "#1e40af",
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
      selectable: false,
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

    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.renderAll();

    if (onObjectSelect) {
      onObjectSelect(group);
    }

    toast(`${furniture.name} added to canvas`);
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

    if (activeTool === "wall") {
      let wall: Line | null = null;

      fabricCanvas.on("mouse:down", (e) => {
        if (!e.pointer) return;
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);

        setIsDrawing(true);
        setStartPoint({ x: snappedX, y: snappedY });

        wall = new Line([snappedX, snappedY, snappedX, snappedY], {
          stroke: "#ef4444",
          strokeWidth: 8,
          selectable: true,
        });
        fabricCanvas.add(wall);
      });

      fabricCanvas.on("mouse:move", (e) => {
        if (!isDrawing || !wall || !e.pointer) return;
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);

        wall.set({
          x2: snappedX,
          y2: snappedY,
        });
        fabricCanvas.renderAll();
      });

      fabricCanvas.on("mouse:up", () => {
        setIsDrawing(false);
        setStartPoint(null);
        wall = null;
      });
    } else if (activeTool === "room") {
      let room: Rect | null = null;

      fabricCanvas.on("mouse:down", (e) => {
        if (!e.pointer) return;
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);

        setIsDrawing(true);
        setStartPoint({ x: snappedX, y: snappedY });

        room = new Rect({
          left: snappedX,
          top: snappedY,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: "#3b82f6",
          strokeWidth: 2,
          selectable: true,
        });
        fabricCanvas.add(room);
      });

      fabricCanvas.on("mouse:move", (e) => {
        if (!isDrawing || !room || !e.pointer || !startPoint) return;
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
      });

      fabricCanvas.on("mouse:up", () => {
        setIsDrawing(false);
        setStartPoint(null);
        room = null;
      });
    } else if (activeTool === "dimension") {
      // Add dimension tool functionality
      let startPoint: { x: number; y: number } | null = null;

      fabricCanvas.on("mouse:down", (e) => {
        if (!e.pointer) return;
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);

        if (!startPoint) {
          startPoint = { x: snappedX, y: snappedY };
          toast("Click second point to create dimension");
        } else {
          addDimension(startPoint.x, startPoint.y, snappedX, snappedY);
          startPoint = null;
          toast("Dimension added");
        }
      });
    }

    // Handle canvas clicks for deselection
    fabricCanvas.on("mouse:down", (e) => {
      if (!e.target && activeTool === "select") {
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
        if (onObjectSelect) {
          onObjectSelect(null);
        }
      }
    });

    // Handle double-click for text editing
    fabricCanvas.on("mouse:dblclick", (e) => {
      if (e.target && (e.target as any).furnitureText) {
        const group = e.target;
        const textObject = (group as any).furnitureText;
        const currentText = textObject.text;

        const newText = prompt("Enter new name:", currentText);
        if (newText && newText.trim()) {
          textObject.set("text", newText.trim());
          fabricCanvas.renderAll();
          toast("Furniture name updated");
        }
      }
    });

    // Object selection events
    fabricCanvas.on("selection:created", (e) => {
      if (onObjectSelect && e.selected) {
        onObjectSelect(e.selected[0]);
      }
    });

    fabricCanvas.on("selection:updated", (e) => {
      if (onObjectSelect && e.selected) {
        onObjectSelect(e.selected[0]);
      }
    });

    fabricCanvas.on("selection:cleared", () => {
      if (onObjectSelect) {
        onObjectSelect(null);
      }
    });

  }, [activeTool, fabricCanvas, isDrawing, startPoint, onObjectSelect]);

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
    <div className="flex-1 bg-canvas-bg border border-border rounded-lg overflow-hidden shadow-lg">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
});