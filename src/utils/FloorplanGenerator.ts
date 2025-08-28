import { Canvas as FabricCanvas, Rect, Line, IText, Group } from "fabric";

interface FloorplanElement {
  type: 'room' | 'wall' | 'door' | 'window';
  coordinates: { x: number; y: number; width: number; height: number };
  label?: string;
  confidence: number;
}

interface FloorplanData {
  elements: FloorplanElement[];
  dimensions: { width: number; height: number };
  scale: number;
}

export class FloorplanGenerator {
  static generateCanvasFromFloorplan(
    canvas: FabricCanvas, 
    floorplanData: FloorplanData
  ): void {
    console.log('Generating canvas from floorplan data:', floorplanData);

    // Clear existing canvas content (except grid)
    this.clearCanvasContent(canvas);

    // Calculate scale factor to fit canvas
    const scaleFactor = this.calculateScaleFactor(canvas, floorplanData.dimensions);
    
    // Generate rooms
    this.generateRooms(canvas, floorplanData.elements, scaleFactor);
    
    // Generate walls
    this.generateWalls(canvas, floorplanData.elements, scaleFactor);
    
    // Generate doors and windows
    this.generateDoorsAndWindows(canvas, floorplanData.elements, scaleFactor);
    
    // Render the canvas
    canvas.renderAll();
    
    console.log('Canvas generation complete');
  }

  private static clearCanvasContent(canvas: FabricCanvas): void {
    // Remove all objects except grid lines
    const objectsToRemove = canvas.getObjects().filter((obj: any) => !obj.isGridLine);
    objectsToRemove.forEach(obj => canvas.remove(obj));
  }

  private static calculateScaleFactor(
    canvas: FabricCanvas, 
    originalDimensions: { width: number; height: number }
  ): number {
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    const scaleX = (canvasWidth * 0.8) / originalDimensions.width;
    const scaleY = (canvasHeight * 0.8) / originalDimensions.height;
    
    return Math.min(scaleX, scaleY);
  }

  private static generateRooms(
    canvas: FabricCanvas, 
    elements: FloorplanElement[], 
    scaleFactor: number
  ): void {
    const rooms = elements.filter(el => el.type === 'room');
    let roomCounter = 1;

    rooms.forEach(room => {
      const scaledCoords = this.scaleCoordinates(room.coordinates, scaleFactor);
      
      // Snap to grid
      const snappedCoords = this.snapToGrid(scaledCoords, 20);
      
      // Create room rectangle
      const roomRect = new Rect({
        left: snappedCoords.x + 100, // Offset from edge
        top: snappedCoords.y + 100,
        width: snappedCoords.width,
        height: snappedCoords.height,
        fill: "rgba(59, 130, 246, 0.1)",
        stroke: "#3b82f6",
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingFlip: true,
        cornerColor: "#3b82f6",
        cornerSize: 8,
        transparentCorners: false,
        hoverCursor: 'move',
        moveCursor: 'move',
      });

      // Create room label
      const roomLabel = room.label || `Room ${roomCounter}`;
      const label = new IText(roomLabel, {
        left: snappedCoords.x + 100 + snappedCoords.width / 2,
        top: snappedCoords.y + 100 + snappedCoords.height / 2,
        fontSize: 16,
        fill: "#1e40af",
        fontFamily: "Arial",
        originX: "center",
        originY: "center",
        selectable: false,
        editable: true,
        evented: false,
        lockScalingX: true,
        lockScalingY: true,
      });

      // Group room and label
      const roomGroup = new Group([roomRect, label], {
        left: snappedCoords.x + 100,
        top: snappedCoords.y + 100,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockScalingFlip: true,
        cornerColor: "#3b82f6",
        cornerSize: 8,
        transparentCorners: false,
      });

      // Add properties
      (roomGroup as any).id = `room_${Date.now()}_${roomCounter}`;
      (roomGroup as any).roomText = label;
      (roomGroup as any).isRoom = true;
      (roomGroup as any).aiGenerated = true;
      (roomGroup as any).confidence = room.confidence;

      canvas.add(roomGroup);
      roomCounter++;
    });
  }

  private static generateWalls(
    canvas: FabricCanvas, 
    elements: FloorplanElement[], 
    scaleFactor: number
  ): void {
    const walls = elements.filter(el => el.type === 'wall');

    walls.forEach(wall => {
      const scaledCoords = this.scaleCoordinates(wall.coordinates, scaleFactor);
      const snappedCoords = this.snapToGrid(scaledCoords, 20);
      
      // Create wall as a thick line
      const wallLine = new Line([
        snappedCoords.x + 100,
        snappedCoords.y + 100,
        snappedCoords.x + 100 + snappedCoords.width,
        snappedCoords.y + 100 + snappedCoords.height
      ], {
        stroke: "#ef4444",
        strokeWidth: 8,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      });

      (wallLine as any).isWall = true;
      (wallLine as any).aiGenerated = true;
      (wallLine as any).confidence = wall.confidence;

      canvas.add(wallLine);
    });
  }

  private static generateDoorsAndWindows(
    canvas: FabricCanvas, 
    elements: FloorplanElement[], 
    scaleFactor: number
  ): void {
    const doorsAndWindows = elements.filter(el => el.type === 'door' || el.type === 'window');

    doorsAndWindows.forEach(element => {
      const scaledCoords = this.scaleCoordinates(element.coordinates, scaleFactor);
      const snappedCoords = this.snapToGrid(scaledCoords, 20);
      
      const color = element.type === 'door' ? "#10b981" : "#06b6d4";
      const strokeWidth = element.type === 'door' ? 6 : 4;
      
      // Create as a rectangle
      const elementRect = new Rect({
        left: snappedCoords.x + 100,
        top: snappedCoords.y + 100,
        width: Math.max(snappedCoords.width, 20),
        height: Math.max(snappedCoords.height, 20),
        fill: "transparent",
        stroke: color,
        strokeWidth: strokeWidth,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      });

      // Add label
      const label = new IText(element.type === 'door' ? 'Door' : 'Window', {
        left: snappedCoords.x + 100 + Math.max(snappedCoords.width, 20) / 2,
        top: snappedCoords.y + 100 + Math.max(snappedCoords.height, 20) / 2,
        fontSize: 10,
        fill: color,
        fontFamily: "Arial",
        originX: "center",
        originY: "center",
        selectable: false,
        editable: false,
        evented: false,
      });

      // Group element and label
      const elementGroup = new Group([elementRect, label], {
        left: snappedCoords.x + 100,
        top: snappedCoords.y + 100,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      });

      (elementGroup as any).elementType = element.type;
      (elementGroup as any).aiGenerated = true;
      (elementGroup as any).confidence = element.confidence;

      canvas.add(elementGroup);
    });
  }

  private static scaleCoordinates(
    coords: { x: number; y: number; width: number; height: number },
    scaleFactor: number
  ): { x: number; y: number; width: number; height: number } {
    return {
      x: coords.x * scaleFactor,
      y: coords.y * scaleFactor,
      width: coords.width * scaleFactor,
      height: coords.height * scaleFactor
    };
  }

  private static snapToGrid(
    coords: { x: number; y: number; width: number; height: number },
    gridSize: number
  ): { x: number; y: number; width: number; height: number } {
    return {
      x: Math.round(coords.x / gridSize) * gridSize,
      y: Math.round(coords.y / gridSize) * gridSize,
      width: Math.round(coords.width / gridSize) * gridSize,
      height: Math.round(coords.height / gridSize) * gridSize
    };
  }
}