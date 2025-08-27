import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DiagnosticOverlay = () => {
  const [diagnostics, setDiagnostics] = useState({
    renderTime: Date.now(),
    windowSize: { width: 0, height: 0 },
    fabricLoaded: false,
    cssVariables: false,
  });

  useEffect(() => {
    // Check window size
    const updateSize = () => {
      setDiagnostics(prev => ({
        ...prev,
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      }));
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    // Check if Fabric.js is loaded
    try {
      const { Canvas } = require('fabric');
      setDiagnostics(prev => ({ ...prev, fabricLoaded: !!Canvas }));
    } catch (error) {
      console.error("Fabric.js load error:", error);
    }

    // Check CSS variables
    const testElement = document.createElement('div');
    testElement.style.display = 'none';
    document.body.appendChild(testElement);
    const computedStyle = getComputedStyle(testElement);
    const hasBackground = !!computedStyle.getPropertyValue('--background');
    document.body.removeChild(testElement);
    
    setDiagnostics(prev => ({ ...prev, cssVariables: hasBackground }));

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <Card className="fixed top-4 right-4 w-64 z-50 bg-background/90 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <div>Render: {new Date(diagnostics.renderTime).toLocaleTimeString()}</div>
        <div>Window: {diagnostics.windowSize.width}×{diagnostics.windowSize.height}</div>
        <div>Fabric.js: {diagnostics.fabricLoaded ? '✅' : '❌'}</div>
        <div>CSS Variables: {diagnostics.cssVariables ? '✅' : '❌'}</div>
      </CardContent>
    </Card>
  );
};