import { useState, useEffect } from 'react';

interface KeyboardHintsProps {
  autoRotate: boolean;
  scale: number;
  modelType: number;
  modelName: string;
  hasCustomModel: boolean;
}

export function KeyboardHints({ autoRotate, scale, modelType, modelName, hasCustomModel }: KeyboardHintsProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 p-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <div className="max-w-4xl mx-auto">
        {/* Status Bar */}
        <div className="flex justify-center gap-6 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="control-label">Model:</span>
            <span className="hologram-text font-display">{modelName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="control-label">Scale:</span>
            <span className="hologram-text font-display">{scale.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="control-label">Auto-Rotate:</span>
            <span className={`font-display ${autoRotate ? 'text-primary' : 'text-muted-foreground'}`}>
              {autoRotate ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-4 gap-4 text-center">
          {/* Rotation */}
          <div className="hologram-border rounded-lg p-3 bg-background/50 backdrop-blur-sm">
            <div className="control-label mb-2">Rotation</div>
            <div className="flex flex-wrap justify-center gap-1 text-xs">
              <span className="key-hint">←</span>
              <span className="key-hint">→</span>
              <span className="key-hint">↑</span>
              <span className="key-hint">↓</span>
              <span className="key-hint">Q</span>
              <span className="key-hint">E</span>
            </div>
          </div>

          {/* Scale */}
          <div className="hologram-border rounded-lg p-3 bg-background/50 backdrop-blur-sm">
            <div className="control-label mb-2">Scale</div>
            <div className="flex justify-center gap-1">
              <span className="key-hint">+</span>
              <span className="key-hint">-</span>
            </div>
          </div>

          {/* Models */}
          <div className="hologram-border rounded-lg p-3 bg-background/50 backdrop-blur-sm">
            <div className="control-label mb-2">Models</div>
            <div className="flex justify-center gap-1">
              {hasCustomModel && <span className={`key-hint ${modelType === 0 ? 'bg-primary/30' : ''}`}>0</span>}
              <span className={`key-hint ${modelType === 1 ? 'bg-primary/30' : ''}`}>1</span>
              <span className={`key-hint ${modelType === 2 ? 'bg-primary/30' : ''}`}>2</span>
              <span className={`key-hint ${modelType === 3 ? 'bg-primary/30' : ''}`}>3</span>
            </div>
          </div>

          {/* Actions */}
          <div className="hologram-border rounded-lg p-3 bg-background/50 backdrop-blur-sm">
            <div className="control-label mb-2">Actions</div>
            <div className="flex justify-center gap-1">
              <span className={`key-hint ${autoRotate ? 'bg-primary/30' : ''}`}>R</span>
              <span className="key-hint">Space</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
