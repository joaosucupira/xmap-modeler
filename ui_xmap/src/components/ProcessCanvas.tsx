import { useState, useRef, useCallback } from "react";
import { 
  Square, 
  Circle, 
  Diamond, 
  ArrowRight,
  MousePointer,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CanvasElement {
  id: string;
  type: 'process' | 'decision' | 'start' | 'end';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

const mockElements: CanvasElement[] = [
  {
    id: '1',
    type: 'start',
    x: 100,
    y: 100,
    width: 80,
    height: 80,
    text: 'Início'
  },
  {
    id: '2',
    type: 'process',
    x: 250,
    y: 100,
    width: 120,
    height: 60,
    text: 'Análise do Pedido'
  },
  {
    id: '3',
    type: 'decision',
    x: 450,
    y: 100,
    width: 100,
    height: 80,
    text: 'Aprovado?'
  }
];

export const ProcessCanvas = () => {
  const [elements, setElements] = useState<CanvasElement[]>(mockElements);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(100);
  }, []);

  const renderElement = (element: CanvasElement) => {
    const style = {
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
    };

    const baseClasses = "absolute flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 hover:shadow-md border-2";
    
    switch (element.type) {
      case 'start':
      case 'end':
        return (
          <div
            key={element.id}
            className={`${baseClasses} rounded-full bg-card border-primary text-primary hover:bg-accent`}
            style={style}
          >
            {element.text}
          </div>
        );
      
      case 'process':
        return (
          <div
            key={element.id}
            className={`${baseClasses} rounded-lg bg-card border-primary text-foreground hover:bg-accent`}
            style={style}
          >
            {element.text}
          </div>
        );
      
      case 'decision':
        return (
          <div
            key={element.id}
            className={`${baseClasses} bg-card border-secondary text-foreground hover:bg-accent`}
            style={{
              ...style,
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
            }}
          >
            {element.text}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-subtle">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-card border-b shadow-soft">
        <div className="flex items-center gap-1">
          <Button
            variant={selectedTool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('select')}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedTool === 'pan' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('pan')}
          >
            <Hand className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1">
          <Button
            variant={selectedTool === 'process' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('process')}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            <span className="text-xs">Processo</span>
          </Button>
          <Button
            variant={selectedTool === 'decision' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('decision')}
            className="flex items-center gap-2"
          >
            <Diamond className="h-4 w-4" />
            <span className="text-xs">Decisão</span>
          </Button>
          <Button
            variant={selectedTool === 'start' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('start')}
            className="flex items-center gap-2"
          >
            <Circle className="h-4 w-4" />
            <span className="text-xs">Início/Fim</span>
          </Button>
          <Button
            variant={selectedTool === 'connector' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTool('connector')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="text-xs">Conector</span>
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6 ml-auto" />
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs px-2 py-1 bg-muted rounded min-w-[50px] text-center">
            {zoom}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={canvasRef}
          className="absolute inset-0 bg-canvas-bg"
          style={{
            backgroundImage: `
              radial-gradient(circle, hsl(var(--canvas-grid)) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left'
          }}
        >
          {elements.map(renderElement)}
        </div>
      </div>
    </div>
  );
};