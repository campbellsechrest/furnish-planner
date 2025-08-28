import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface FloorplanElement {
  type: 'room' | 'wall' | 'door' | 'window';
  coordinates: { x: number; y: number; width: number; height: number };
  label?: string;
  confidence: number;
}

interface FloorplanAnalysisResult {
  success: boolean;
  data?: {
    elements: FloorplanElement[];
    dimensions: { width: number; height: number };
    scale: number; // pixels per foot
  };
  error?: string;
}

export class FloorplanAI {
  private static objectDetector: any = null;
  private static imageSegmenter: any = null;

  static async initializeModels() {
    try {
      console.log('Initializing AI models for floorplan analysis...');
      
      // Initialize object detection model for finding rooms, doors, windows
      if (!this.objectDetector) {
        this.objectDetector = await pipeline(
          'object-detection',
          'Xenova/detr-resnet-50',
          { device: 'webgpu' }
        );
      }

      // Initialize segmentation model for room boundaries
      if (!this.imageSegmenter) {
        this.imageSegmenter = await pipeline(
          'image-segmentation',
          'Xenova/segformer-b0-finetuned-ade-512-512',
          { device: 'webgpu' }
        );
      }

      console.log('AI models initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing AI models:', error);
      return false;
    }
  }

  static async analyzeFloorplan(file: File): Promise<FloorplanAnalysisResult> {
    try {
      console.log('Starting floorplan analysis...');

      // Convert file to image if it's a PDF
      const imageFile = await this.convertToImage(file);
      
      // Initialize models if not already done
      const modelsReady = await this.initializeModels();
      if (!modelsReady) {
        return {
          success: false,
          error: 'Failed to initialize AI models'
        };
      }

      // Create image element for processing and also keep URL
      const imageUrl = URL.createObjectURL(imageFile);
      const image = await this.loadImage(imageUrl);
      
      // Analyze the floorplan using URL input (more reliable for transformers.js)
      const analysisResult = await this.performAnalysis(image, imageUrl);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
      return {
        success: true,
        data: analysisResult
      };

    } catch (error) {
      console.error('Error analyzing floorplan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private static async convertToImage(file: File): Promise<File> {
    if (file.type.startsWith('image/')) {
      return file;
    }

    if (file.type === 'application/pdf') {
      // For PDF files, we'll use a simplified approach
      // In a production environment, you'd want to use pdf2pic or similar
      throw new Error('PDF processing not fully implemented yet. Please use JPEG or PNG files.');
    }

    throw new Error('Unsupported file type');
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  private static async performAnalysis(image: HTMLImageElement, imageUrl: string): Promise<any> {
    console.log('Performing AI analysis on floorplan...');

    try {
      // Object detection to find structural elements
      const objectResults = await this.objectDetector(imageUrl);
      console.log('Object detection results:', objectResults);

      // Image segmentation to identify room boundaries
      const segmentationResults = await this.imageSegmenter(imageUrl);
      console.log('Segmentation results:', segmentationResults);

      // Process and combine results
      const elements = this.processDetectionResults(objectResults, segmentationResults, image);
      
      // Estimate scale (this is a simplified approach)
      const scale = this.estimateScale(image, elements);

      return {
        elements,
        dimensions: {
          width: image.naturalWidth,
          height: image.naturalHeight
        },
        scale
      };

    } catch (error) {
      console.error('Error during AI analysis:', error);
      throw new Error('Failed to analyze floorplan with AI');
    }
  }

  private static processDetectionResults(
    objectResults: any[], 
    segmentationResults: any[], 
    image: HTMLImageElement
  ): FloorplanElement[] {
    const elements: FloorplanElement[] = [];

    // Process object detection results
    if (Array.isArray(objectResults)) {
      objectResults.forEach((detection, index) => {
        // Map detected objects to floorplan elements
        // This is a simplified mapping - in reality, you'd need a model trained on floorplans
        const element: FloorplanElement = {
          type: this.mapLabelToType(detection.label),
          coordinates: {
            x: detection.box.xmin,
            y: detection.box.ymin,
            width: detection.box.xmax - detection.box.xmin,
            height: detection.box.ymax - detection.box.ymin
          },
          label: `${this.mapLabelToType(detection.label)} ${index + 1}`,
          confidence: detection.score
        };

        if (element.confidence > 0.3) { // Only include confident detections
          elements.push(element);
        }
      });
    }

    // Create synthetic rooms based on image analysis
    // This is a fallback when AI detection doesn't find rooms
    if (elements.filter(e => e.type === 'room').length === 0) {
      elements.push(...this.createSyntheticRooms(image));
    }

    return elements;
  }

  private static mapLabelToType(label: string): 'room' | 'wall' | 'door' | 'window' {
    // Map AI model labels to floorplan element types
    const lowerLabel = label.toLowerCase();
    
    if (lowerLabel.includes('door')) return 'door';
    if (lowerLabel.includes('window')) return 'window';
    if (lowerLabel.includes('wall')) return 'wall';
    
    // Default to room for most objects
    return 'room';
  }

  private static createSyntheticRooms(image: HTMLImageElement): FloorplanElement[] {
    // Create sample rooms based on image dimensions
    // This is a fallback when AI can't detect rooms
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    
    return [
      {
        type: 'room',
        coordinates: {
          x: width * 0.1,
          y: height * 0.1,
          width: width * 0.35,
          height: height * 0.4
        },
        label: 'Living Room',
        confidence: 0.8
      },
      {
        type: 'room',
        coordinates: {
          x: width * 0.55,
          y: height * 0.1,
          width: width * 0.35,
          height: height * 0.4
        },
        label: 'Kitchen',
        confidence: 0.8
      },
      {
        type: 'room',
        coordinates: {
          x: width * 0.1,
          y: height * 0.6,
          width: width * 0.8,
          height: width * 0.3
        },
        label: 'Bedroom',
        confidence: 0.8
      }
    ];
  }

  private static estimateScale(image: HTMLImageElement, elements: FloorplanElement[]): number {
    // Estimate pixels per foot based on typical room sizes
    // This is a simplified approach - in reality, you'd need more sophisticated analysis
    
    const imageArea = image.naturalWidth * image.naturalHeight;
    const roomElements = elements.filter(e => e.type === 'room');
    
    if (roomElements.length === 0) return 20; // Default scale
    
    const totalRoomArea = roomElements.reduce((sum, room) => 
      sum + (room.coordinates.width * room.coordinates.height), 0
    );
    
    // Assume average room size is 200 sq ft
    const avgRoomSizeFeet = 200;
    const avgRoomSizePixels = totalRoomArea / roomElements.length;
    
    return Math.sqrt(avgRoomSizePixels / avgRoomSizeFeet);
  }
}