import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  Minus, 
  Square, 
  Ruler, 
  Image, 
  Undo, 
  Redo, 
  Save,
  FolderOpen,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export const DesignToolbar = ({ 
  activeTool, 
  onToolChange, 
  onClear, 
  onSave, 
  onLoad 
}: DesignToolbarProps) => {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "wall", icon: Minus, label: "Draw Wall" },
    { id: "room", icon: Square, label: "Draw Room" },
    { id: "dimension", icon: Ruler, label: "Add Dimension" },
    { id: "photo", icon: Image, label: "Add Photo" },
  ];

  return (
    <div className="bg-gradient-to-r from-background to-secondary border-b border-border shadow-toolbar p-4">
      <div className="flex items-center gap-2">
        {/* Main drawing tools */}
        <div className="flex items-center gap-1 bg-background rounded-lg p-1 shadow-sm">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onToolChange(tool.id)}
              className={cn(
                "h-10 w-10 p-0 transition-all duration-200",
                activeTool === tool.id 
                  ? "bg-tool-active text-white shadow-active" 
                  : "hover:bg-tool-hover hover:text-white"
              )}
              title={tool.label}
              data-testid={`tool-${tool.id}`}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Action tools */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0" title="Undo">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0" title="Redo">
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* File operations */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSave}
            className="h-10 px-3"
            title="Save Project"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLoad}
            className="h-10 px-3"
            title="Load Project"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onClear}
            className="h-10 px-3"
            title="Clear Canvas"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        <div className="ml-auto">
          <div className="text-sm text-muted-foreground">
            FloorPlan Designer
          </div>
        </div>
      </div>
    </div>
  );
};