import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Line, Text } from "fabric";
import { toast } from "sonner";

interface FloorplanCanvasProps {
  activeTool: string;
  onObjectSelect?: (object: any) => void;
  selectedFurniture?: any;
  onClear?: () => void;
}

export const FloorplanCanvas = ({ activeTool, onObjectSelect, selectedFurniture, onClear }: FloorplanCanvasProps) => {
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
      selection: activeTool === "select",
    });

    addGridToCanvas(canvas);

    setFabricCanvas(canvas);
    toast("Canvas ready! Start designing your floorplan.");

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.selection = activeTool === "select";
    fabricCanvas.isDrawingMode = false;

    // Remove previous event listeners
    fabricCanvas.off('mouse:down');
    fabricCanvas.off('mouse:move');
    fabricCanvas.off('mouse:up');

    if (activeTool === "wall") {
      let wall: Line | null = null;

      fabricCanvas.on('mouse:down', (e) => {
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

      fabricCanvas.on('mouse:move', (e) => {
        if (!isDrawing || !wall || !e.pointer) return;
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);
        
        wall.set({
          x2: snappedX,
          y2: snappedY,
        });
        fabricCanvas.renderAll();
      });

      fabricCanvas.on('mouse:up', () => {
        setIsDrawing(false);
        setStartPoint(null);
        wall = null;
      });
    } else if (activeTool === "room") {
      let room: Rect | null = null;

      fabricCanvas.on('mouse:down', (e) => {
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

      fabricCanvas.on('mouse:move', (e) => {
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

      fabricCanvas.on('mouse:up', () => {
        setIsDrawing(false);
        setStartPoint(null);
        room = null;
      });
    } else if (activeTool === "furniture" && selectedFurniture) {
      fabricCanvas.on('mouse:down', (e) => {
        if (!e.pointer) return;
        const snappedX = snapToGrid(e.pointer.x);
        const snappedY = snapToGrid(e.pointer.y);
        
        // Create a simple rectangle to represent furniture
        const furniture = new Rect({
          left: snappedX,
          top: snappedY,
          width: 60, // Default width
          height: 40, // Default height
          fill: selectedFurniture.color?.replace('bg-', '').replace('-100', '') || "#3b82f6",
          stroke: "#1e40af",
          strokeWidth: 2,
          selectable: true,
        });
        
        // Add furniture name as text
        const furnitureText = new Text(selectedFurniture.name || 'Furniture', {
          left: snappedX + 30,
          top: snappedY + 20,
          fontSize: 12,
          fill: "#1e40af",
          fontFamily: "Arial",
          originX: "center",
          originY: "center",
          selectable: false,
        });
        
        fabricCanvas.add(furniture);
        fabricCanvas.add(furnitureText);
        toast(`${selectedFurniture.name} added to canvas`);
      });
    } else if (activeTool === "dimension") {
      // Add dimension tool functionality
      let startPoint: { x: number; y: number } | null = null;
      
      fabricCanvas.on('mouse:down', (e) => {
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

    // Object selection
    fabricCanvas.on('selection:created', (e) => {
      if (onObjectSelect && e.selected) {
        onObjectSelect(e.selected[0]);
      }
    });

    fabricCanvas.on('selection:updated', (e) => {
      if (onObjectSelect && e.selected) {
        onObjectSelect(e.selected[0]);
      }
    });

  }, [activeTool, fabricCanvas, isDrawing, startPoint, onObjectSelect, selectedFurniture]);

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
    onClear?.(); // Call parent clear handler if provided
  };

  return (
    <div className="flex-1 bg-canvas-bg border border-border rounded-lg overflow-hidden shadow-lg">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Expose clearCanvas function to parent */}
      <div style={{ display: 'none' }} ref={(el) => {
        if (el && clearCanvas) {
          (el as any).clearCanvas = clearCanvas;
        }
      }} />
    </div>
  );
};