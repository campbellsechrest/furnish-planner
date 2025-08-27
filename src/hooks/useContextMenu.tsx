import { useState, useCallback } from 'react';

interface ContextMenuState {
  isVisible: boolean;
  x: number;
  y: number;
  target: any;
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isVisible: false,
    x: 0,
    y: 0,
    target: null,
  });

  const showContextMenu = useCallback((x: number, y: number, target: any) => {
    setContextMenu({
      isVisible: true,
      x,
      y,
      target,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
};