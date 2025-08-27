import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface ContextMenuProps {
  isVisible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export const ContextMenu = ({
  isVisible,
  x,
  y,
  onClose,
  onBringToFront,
  onSendToBack,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <Card
      ref={menuRef}
      className="fixed z-50 min-w-[140px] p-1 shadow-lg border bg-background"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="space-y-1">
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
          onClick={() => {
            onBringToFront();
            onClose();
          }}
        >
          Bring to Front
        </button>
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
          onClick={() => {
            onSendToBack();
            onClose();
          }}
        >
          Send to Back
        </button>
      </div>
    </Card>
  );
};