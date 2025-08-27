import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Line, Text } from "fabric";
import { toast } from "sonner";

interface FloorplanCanvasProps {
  activeTool: string;
  onObjectSelect?: (object: any) => void;
}

export const FloorplanCanvas = ({ activeTool, onObjectSelect }: FloorplanCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: "hsl(var(--canvas-bg))",
      selection: activeTool === "select",
    });

    // Add grid
    const gridSize = 20;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Line([i, 0, i, canvasHeight], {
        stroke: "hsl(var(--grid-line))",
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Line([0, i, canvasWidth, i], {
        stroke: "hsl(var(--grid-line))",
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

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
        setIsDrawing(true);
        setStartPoint({ x: e.pointer.x, y: e.pointer.y });

        wall = new Line([e.pointer.x, e.pointer.y, e.pointer.x, e.pointer.y], {
          stroke: "hsl(var(--wall-color))",
          strokeWidth: 8,
          selectable: true,
        });
        fabricCanvas.add(wall);
      });

      fabricCanvas.on('mouse:move', (e) => {
        if (!isDrawing || !wall || !e.pointer) return;
        
        wall.set({
          x2: e.pointer.x,
          y2: e.pointer.y,
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
        setIsDrawing(true);
        setStartPoint({ x: e.pointer.x, y: e.pointer.y });

        room = new Rect({
          left: e.pointer.x,
          top: e.pointer.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: "hsl(var(--primary))",
          strokeWidth: 2,
          selectable: true,
        });
        fabricCanvas.add(room);
      });

      fabricCanvas.on('mouse:move', (e) => {
        if (!isDrawing || !room || !e.pointer || !startPoint) return;
        
        const width = e.pointer.x - startPoint.x;
        const height = e.pointer.y - startPoint.y;
        
        room.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? e.pointer.x : startPoint.x,
          top: height < 0 ? e.pointer.y : startPoint.y,
        });
        fabricCanvas.renderAll();
      });

      fabricCanvas.on('mouse:up', () => {
        setIsDrawing(false);
        setStartPoint(null);
        room = null;
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
    fabricCanvas.backgroundColor = "hsl(var(--canvas-bg))";
    
    // Re-add grid
    const gridSize = 20;
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();

    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Line([i, 0, i, canvasHeight], {
        stroke: "hsl(var(--grid-line))",
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(line);
    }

    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Line([0, i, canvasWidth, i], {
        stroke: "hsl(var(--grid-line))",
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(line);
    }

    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  return (
    <div className="flex-1 bg-canvas-bg border border-border rounded-lg overflow-hidden shadow-lg">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};