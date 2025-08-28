import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileImage, FileText, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { FloorplanAI } from "@/utils/FloorplanAI";
import { validateFile, createSecureObjectURL, revokeSecureObjectURL } from "@/utils/fileValidator";
import { validateFloorplanData } from "@/utils/dataValidator";

interface FloorplanUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onFloorplanAnalyzed: (floorplanData: any) => void;
}

export const FloorplanUpload = ({ isOpen, onClose, onFloorplanAnalyzed }: FloorplanUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Comprehensive security validation
    const validationResult = await validateFile(selectedFile);
    if (!validationResult.isValid) {
      toast.error(validationResult.error || "File validation failed");
      return;
    }

    const sanitizedFile = validationResult.sanitizedFile || selectedFile;
    setFile(sanitizedFile);

    // Create secure preview for images
    if (sanitizedFile.type.startsWith('image/')) {
      const url = createSecureObjectURL(sanitizedFile);
      if (url) {
        setPreviewUrl(url);
      }
    } else {
      setPreviewUrl(null);
    }

    toast.success("File validated and selected successfully");
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      // Simulate file input change
      const fileInput = fileInputRef.current;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInput.files = dataTransfer.files;
        handleFileSelect({ target: fileInput } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const floorplanData = await FloorplanAI.analyzeFloorplan(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (floorplanData.success) {
        // Validate AI output for security
        const validatedData = validateFloorplanData(floorplanData.data);
        if (validatedData) {
          toast.success("Floorplan analyzed and validated successfully!");
          onFloorplanAnalyzed(validatedData);
          onClose();
        } else {
          toast.error("Floorplan analysis produced invalid data");
        }
      } else {
        toast.error(floorplanData.error || "Failed to analyze floorplan");
      }
    } catch (error) {
      console.error('Error analyzing floorplan:', error);
      toast.error("Failed to analyze floorplan");
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      revokeSecureObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setIsAnalyzing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Upload Floorplan
          </DialogTitle>
          <DialogDescription>
            Upload a JPEG, PNG, or PDF file of your floorplan for AI analysis and recreation.
            All files undergo comprehensive security validation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors hover:border-muted-foreground/50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              
              <div>
                <p className="text-lg font-semibold">
                  {file ? file.name : "Drag and drop your floorplan here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files (JPEG, PNG, PDF)
                </p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                {file ? "Change File" : "Select File"}
              </Button>
            </div>
          </div>

          {/* File Preview */}
          {file && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    {file.type === 'application/pdf' ? (
                      <FileText className="w-6 h-6 text-red-500" />
                    ) : (
                      <FileImage className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                </div>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Floorplan preview"
                      className="max-w-full h-48 object-contain rounded border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing floorplan...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isAnalyzing}>
              Cancel
            </Button>
            <Button 
              onClick={handleAnalyze} 
              disabled={!file || isAnalyzing}
              className="min-w-32"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Floorplan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};