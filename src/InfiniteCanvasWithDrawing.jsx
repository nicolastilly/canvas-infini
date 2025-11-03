import React, { useRef, useState, useEffect } from 'react';
import useGestures from './useGestures';
import useDrawingSystem from './useDrawingSystem';
import './InfiniteCanvas.css';

const InfiniteCanvasWithDrawing = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Utilisation du hook personnalisé pour les gestes
  const {
    transform,
    resetTransform,
    centerView,
    zoomIn,
    zoomOut,
    isDragging
  } = useGestures(containerRef, {
    minScale: 0.1,
    maxScale: 5,
    smoothing: true,
    enableInertia: true,
    scaleSensitivity: 0.01
  });
  
  // Utilisation du système de dessin
  const {
    isDrawingEnabled,
    setIsDrawingEnabled,
    paths,
    startPath,
    addPoint,
    endPath,
    clearAll,
    undo,
    DrawingLayer,
    hasDrawings,
    drawingCount
  } = useDrawingSystem(containerRef, transform, isDragging);
  
  // Gestionnaires d'événements pour le dessin
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handlePointerDown = (e) => {
      // Ne pas dessiner si on fait un pinch-to-zoom
      if (e.touches && e.touches.length > 1) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startPath(clientX, clientY);
    };
    
    const handlePointerMove = (e) => {
      // Ne pas dessiner si on fait un pinch-to-zoom
      if (e.touches && e.touches.length > 1) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      addPoint(clientX, clientY);
    };
    
    const handlePointerUp = () => {
      endPath();
    };
    
    // Touch events
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('touchend', handlePointerUp);
    container.addEventListener('touchcancel', handlePointerUp);
    
    // Mouse events
    container.addEventListener('mousedown', handlePointerDown);
    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('mouseleave', handlePointerUp);
    
    return () => {
      container.removeEventListener('touchstart', handlePointerDown);
      container.removeEventListener('touchmove', handlePointerMove);
      container.removeEventListener('touchend', handlePointerUp);
      container.removeEventListener('touchcancel', handlePointerUp);
      container.removeEventListener('mousedown', handlePointerDown);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('mouseleave', handlePointerUp);
    };
  }, [startPath, addPoint, endPath]);
  
  // Contenu du canvas
  const [canvasItems] = useState([
    {
      id: 1,
      type: 'text',
      content: '🚀 Canvas Infini avec Dessin',
      x: 100,
      y: 100,
      fontSize: 32,
      color: '#2196F3'
    },
    {
      id: 2,
      type: 'image',
      src: 'https://picsum.photos/300/200?random=1',
      x: 350,
      y: 150,
      width: 300,
      height: 200
    },
    {
      id: 3,
      type: 'text',
      content: '✏️ Déplacez et dessinez!',
      x: -250,
      y: -100,
      fontSize: 24,
      color: '#4CAF50'
    },
    {
      id: 4,
      type: 'image',
      src: 'https://picsum.photos/400/300?random=2',
      x: -450,
      y: 250,
      width: 400,
      height: 300
    },
    {
      id: 5,
      type: 'text',
      content: '🎨 Les traces restent visibles',
      x: 500,
      y: -150,
      fontSize: 28,
      color: '#FF5722'
    },
    {
      id: 6,
      type: 'image',
      src: 'https://picsum.photos/250/250?random=3',
      x: -100,
      y: 450,
      width: 250,
      height: 250
    }
  ]);
  
  // Fonction pour déterminer quels éléments sont visibles
  const isItemVisible = (item) => {
    if (!containerRef.current) return true;
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = rect.width / transform.scale;
    const viewportHeight = rect.height / transform.scale;
    const viewportX = -transform.x / transform.scale;
    const viewportY = -transform.y / transform.scale;
    
    const margin = 100;
    const itemRight = item.x + (item.width || 200);
    const itemBottom = item.y + (item.height || 50);
    
    return !(
      item.x > viewportX + viewportWidth / 2 + margin ||
      itemRight < viewportX - viewportWidth / 2 - margin ||
      item.y > viewportY + viewportHeight / 2 + margin ||
      itemBottom < viewportY - viewportHeight / 2 - margin
    );
  };
  
  return (
    <div className="infinite-canvas-container" ref={containerRef}>
      {/* Contrôles de navigation */}
      <div className="controls">
        <button onClick={zoomIn} title="Zoom avant">
          <span>🔍+</span>
        </button>
        <button onClick={zoomOut} title="Zoom arrière">
          <span>🔍-</span>
        </button>
        <button onClick={centerView} title="Centrer">
          <span>🎯</span>
        </button>
        <button onClick={resetTransform} title="Réinitialiser">
          <span>🔄</span>
        </button>
        <span className="zoom-level">{Math.round(transform.scale * 100)}%</span>
      </div>
      
      {/* Contrôles de dessin */}
      <div className="drawing-controls">
        <button 
          onClick={() => setIsDrawingEnabled(!isDrawingEnabled)}
          className={isDrawingEnabled ? 'active' : ''}
          title={isDrawingEnabled ? 'Dessin activé' : 'Dessin désactivé'}
        >
          <span>{isDrawingEnabled ? '✏️' : '🚫'}</span>
        </button>
        <button 
          onClick={undo} 
          title="Annuler"
          disabled={!hasDrawings}
        >
          <span>↶</span>
        </button>
        <button 
          onClick={clearAll} 
          title="Tout effacer"
          disabled={!hasDrawings}
        >
          <span>🗑️</span>
        </button>
        {hasDrawings && (
          <span className="drawing-count">{drawingCount} trait{drawingCount > 1 ? 's' : ''}</span>
        )}
      </div>
      
      {/* Informations */}
      <div className="canvas-info">
        <div>📍 Position: X:{Math.round(-transform.x/transform.scale)}, Y:{Math.round(-transform.y/transform.scale)}</div>
        <div>🔍 Zoom: {Math.round(transform.scale * 100)}%</div>
        <div className="gesture-hint">
          {isDragging ? (
            isDrawingEnabled ? '✏️ Dessin en cours...' : '✊ Déplacement...'
          ) : (
            '👆 Glissez pour naviguer et dessiner'
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="instructions">
        <h3>🎨 Canvas Infini</h3>
        <ul>
          <li><strong>Glisser:</strong> Naviguer + Dessiner</li>
          <li><strong>Pincer:</strong> Zoomer/Dézoomer</li>
          <li><strong>Traces:</strong> Persistent partout</li>
          <li><strong>Effacer:</strong> ↶ ou 🗑️</li>
        </ul>
      </div>
      
      {/* Couche de dessin SVG */}
      <DrawingLayer />
      
      {/* Canvas principal */}
      <div 
        className="infinite-canvas"
        ref={canvasRef}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          cursor: isDragging ? (isDrawingEnabled ? 'crosshair' : 'grabbing') : 'grab'
        }}
      >
        {/* Grille de fond */}
        <div className="grid-background"></div>
        
        {/* Point central */}
        <div className="center-marker">
          <div className="center-dot"></div>
          <div className="center-label">Centre (0,0)</div>
        </div>
        
        {/* Axes */}
        <div className="axis axis-x"></div>
        <div className="axis axis-y"></div>
        
        {/* Éléments du canvas */}
        {canvasItems.map(item => {
          if (!isItemVisible(item)) return null;
          
          if (item.type === 'text') {
            return (
              <div
                key={item.id}
                className="canvas-text"
                style={{
                  left: item.x,
                  top: item.y,
                  fontSize: item.fontSize,
                  color: item.color,
                  position: 'absolute',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {item.content}
              </div>
            );
          } else if (item.type === 'image') {
            return (
              <img
                key={item.id}
                src={item.src}
                alt={`Element ${item.id}`}
                className="canvas-image"
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  position: 'absolute',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  objectFit: 'cover'
                }}
                draggable={false}
                loading="lazy"
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default InfiniteCanvasWithDrawing;