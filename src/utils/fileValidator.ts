/**
 * Security-focused file validation utilities
 * Implements comprehensive file validation including magic number checks
 */

interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFile?: File;
}

// File type signatures (magic numbers) for proper validation
const FILE_SIGNATURES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  // Additional signatures for JPEG variants
  jpegExif: [0xFF, 0xD8, 0xFF, 0xE1],
  jpegJfif: [0xFF, 0xD8, 0xFF, 0xE0],
} as const;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'application/pdf'
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILENAME_LENGTH = 255;

/**
 * Validates file based on multiple security criteria
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  try {
    // Basic file existence check
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }

    // Filename validation and sanitization
    const sanitizedName = sanitizeFilename(file.name);
    if (!sanitizedName) {
      return { isValid: false, error: 'Invalid filename' };
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed' };
    }

    // Magic number validation (most important security check)
    const magicNumberValid = await validateMagicNumber(file);
    if (!magicNumberValid) {
      return { isValid: false, error: 'File content does not match file extension. Possible security risk detected.' };
    }

    // Content validation for additional security
    const contentValid = await validateFileContent(file);
    if (!contentValid) {
      return { isValid: false, error: 'File content validation failed' };
    }

    // Create sanitized file if filename changed
    const sanitizedFile = sanitizedName !== file.name 
      ? new File([file], sanitizedName, { type: file.type })
      : file;

    return { 
      isValid: true, 
      sanitizedFile 
    };

  } catch (error) {
    console.error('File validation error:', error);
    return { isValid: false, error: 'File validation failed due to security checks' };
  }
}

/**
 * Validates file magic number against file type
 */
async function validateMagicNumber(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const isJpeg = checkSignature(bytes, FILE_SIGNATURES.jpeg) ||
                   checkSignature(bytes, FILE_SIGNATURES.jpegExif) ||
                   checkSignature(bytes, FILE_SIGNATURES.jpegJfif);
    
    const isPng = checkSignature(bytes, FILE_SIGNATURES.png);
    const isPdf = checkSignature(bytes, FILE_SIGNATURES.pdf);

    switch (file.type) {
      case 'image/jpeg':
      case 'image/jpg':
        return isJpeg;
      case 'image/png':
        return isPng;
      case 'application/pdf':
        return isPdf;
      default:
        return false;
    }
  } catch (error) {
    console.error('Magic number validation failed:', error);
    return false;
  }
}

/**
 * Checks if bytes match a signature
 */
function checkSignature(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Additional content validation for security
 */
async function validateFileContent(file: File): Promise<boolean> {
  try {
    // Basic file integrity checks
    if (file.type.startsWith('image/')) {
      return await validateImageContent(file);
    } else if (file.type === 'application/pdf') {
      return await validatePdfContent(file);
    }
    return false;
  } catch (error) {
    console.error('Content validation failed:', error);
    return false;
  }
}

/**
 * Validates image content by attempting to load it
 */
async function validateImageContent(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Additional checks could be added here
      resolve(img.width > 0 && img.height > 0 && img.width <= 10000 && img.height <= 10000);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    
    img.src = url;
    
    // Timeout for security
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(false);
    }, 5000);
  });
}

/**
 * Basic PDF content validation
 */
async function validatePdfContent(file: File): Promise<boolean> {
  try {
    // Read first chunk to validate PDF structure
    const chunk = await file.slice(0, 1024).text();
    return chunk.includes('%PDF-') && chunk.includes('\n');
  } catch (error) {
    return false;
  }
}

/**
 * Sanitizes filename for security
 */
function sanitizeFilename(filename: string): string {
  if (!filename || filename.length > MAX_FILENAME_LENGTH) {
    return '';
  }

  // Remove dangerous characters and normalize
  const sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous chars
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, MAX_FILENAME_LENGTH)
    .trim();

  // Ensure we have a valid filename
  if (!sanitized || sanitized === '.') {
    return '';
  }

  return sanitized;
}

/**
 * Creates a secure blob URL with validation
 */
export function createSecureObjectURL(file: File): string | null {
  try {
    // Additional validation could be added here
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Failed to create secure object URL:', error);
    return null;
  }
}

/**
 * Safely revokes object URL
 */
export function revokeSecureObjectURL(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to revoke object URL:', error);
  }
}