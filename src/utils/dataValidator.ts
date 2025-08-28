/**
 * Data validation and sanitization utilities for AI model outputs and user inputs
 */

import DOMPurify from 'dompurify';

// Define schemas for expected data structures
export interface FloorplanElement {
  type: 'room' | 'wall' | 'door' | 'window';
  coordinates: number[];
  label?: string;
  confidence?: number;
}

export interface FloorplanData {
  elements: FloorplanElement[];
  dimensions: { width: number; height: number };
  scale: number;
}

export interface FurnitureData {
  id?: string;
  name: string;
  category: string;
  dimensions: string;
  color: string;
}

/**
 * Validates and sanitizes floorplan analysis data from AI models
 */
export function validateFloorplanData(data: any): FloorplanData | null {
  try {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid floorplan data: not an object');
      return null;
    }

    const validated: FloorplanData = {
      elements: [],
      dimensions: { width: 0, height: 0 },
      scale: 20 // default scale
    };

    // Validate elements array
    if (Array.isArray(data.elements)) {
      validated.elements = data.elements
        .map(validateFloorplanElement)
        .filter(Boolean) as FloorplanElement[];
    }

    // Validate dimensions
    if (data.dimensions && typeof data.dimensions === 'object') {
      const width = sanitizeNumber(data.dimensions.width, 100, 10000);
      const height = sanitizeNumber(data.dimensions.height, 100, 10000);
      if (width && height) {
        validated.dimensions = { width, height };
      }
    }

    // Validate scale
    if (typeof data.scale === 'number') {
      validated.scale = sanitizeNumber(data.scale, 1, 1000) || 20;
    }

    return validated;
  } catch (error) {
    console.error('Floorplan data validation failed:', error);
    return null;
  }
}

/**
 * Validates individual floorplan element
 */
function validateFloorplanElement(element: any): FloorplanElement | null {
  try {
    if (!element || typeof element !== 'object') return null;

    const validTypes = ['room', 'wall', 'door', 'window'];
    if (!validTypes.includes(element.type)) return null;

    // Validate coordinates array
    if (!Array.isArray(element.coordinates)) return null;
    const coordinates = element.coordinates
      .map((coord: any) => sanitizeNumber(coord, -10000, 10000))
      .filter((coord): coord is number => coord !== null);
    
    if (coordinates.length < 4) return null; // Need at least x, y, width, height

    const validated: FloorplanElement = {
      type: element.type,
      coordinates: coordinates.slice(0, 8) // Limit to max 8 coordinates
    };

    // Optional sanitized label
    if (element.label && typeof element.label === 'string') {
      validated.label = sanitizeText(element.label, 100);
    }

    // Optional confidence score
    if (typeof element.confidence === 'number') {
      validated.confidence = Math.max(0, Math.min(1, element.confidence));
    }

    return validated;
  } catch (error) {
    console.error('Element validation failed:', error);
    return null;
  }
}

/**
 * Validates and sanitizes furniture data
 */
export function validateFurnitureData(data: any): FurnitureData | null {
  try {
    if (!data || typeof data !== 'object') return null;

    const name = sanitizeText(data.name, 100);
    const category = sanitizeText(data.category, 50);
    const dimensions = sanitizeText(data.dimensions, 50);
    const color = sanitizeText(data.color, 50);

    if (!name || !category || !dimensions || !color) {
      return null;
    }

    const validated: FurnitureData = {
      name,
      category,
      dimensions,
      color
    };

    // Optional ID
    if (data.id && typeof data.id === 'string') {
      validated.id = sanitizeText(data.id, 50);
    }

    return validated;
  } catch (error) {
    console.error('Furniture data validation failed:', error);
    return null;
  }
}

/**
 * Validates JSON data from drag and drop or external sources
 */
export function validateJsonData(jsonString: string): any {
  try {
    // Limit JSON size to prevent DoS
    if (jsonString.length > 100000) {
      throw new Error('JSON data too large');
    }

    const parsed = JSON.parse(jsonString);
    
    // Basic structure validation
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid JSON structure');
    }

    return sanitizeObject(parsed);
  } catch (error) {
    console.error('JSON validation failed:', error);
    return null;
  }
}

/**
 * Sanitizes text input to prevent XSS and ensure reasonable length
 */
function sanitizeText(text: any, maxLength: number = 255): string | null {
  if (typeof text !== 'string') return null;
  
  // Use DOMPurify to prevent XSS
  const sanitized = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  
  if (sanitized.length === 0 || sanitized.length > maxLength) {
    return null;
  }

  return sanitized.trim();
}

/**
 * Sanitizes and validates numeric input
 */
function sanitizeNumber(value: any, min: number, max: number): number | null {
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) return null;
  if (num < min || num > max) return null;
  
  return num;
}

/**
 * Recursively sanitizes object properties
 */
function sanitizeObject(obj: any, depth: number = 0): any {
  // Prevent deep recursion attacks
  if (depth > 10) return null;
  
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Limit array size
    return obj.slice(0, 1000).map(item => sanitizeObject(item, depth + 1));
  }

  const sanitized: any = {};
  let propertyCount = 0;

  for (const [key, value] of Object.entries(obj)) {
    // Limit number of properties
    if (propertyCount >= 100) break;
    
    // Sanitize property names
    const sanitizedKey = sanitizeText(key, 100);
    if (!sanitizedKey) continue;

    sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
    propertyCount++;
  }

  return sanitized;
}

/**
 * Validates canvas objects to prevent unsafe operations
 */
export function validateCanvasObject(obj: any): boolean {
  try {
    if (!obj || typeof obj !== 'object') return false;

    // Check for dangerous properties that could execute code
    const dangerousProps = ['src', 'href', 'onclick', 'onload', 'onerror'];
    for (const prop of dangerousProps) {
      if (obj.hasOwnProperty(prop)) {
        console.warn(`Dangerous property detected: ${prop}`);
        return false;
      }
    }

    // Validate numeric properties are within reasonable bounds
    const numericProps = ['left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle'];
    for (const prop of numericProps) {
      if (obj.hasOwnProperty(prop)) {
        const value = sanitizeNumber(obj[prop], -10000, 10000);
        if (value === null) {
          console.warn(`Invalid numeric property: ${prop}`);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Canvas object validation failed:', error);
    return false;
  }
}