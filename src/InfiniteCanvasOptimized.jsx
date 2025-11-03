import React, { useRef, useState } from 'react';
import useGestures from './useGestures';
import './InfiniteCanvas.css';

const InfiniteCanvasOptimized = () => {
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
  
  // Contenu du canvas
  const [canvasItems] = useState([
    {
      id: 1,
      type: 'text',
      content: '🚀 Canvas Infini Tactile',
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
      content: '✨ Glissez pour naviguer',
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
      content: '🔍 Pincez pour zoomer',
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
    },
    {
      id: 7,
      type: 'text',
      content: '🎨 Canvas sans limites!',
      x: 200,
      y: 400,
      fontSize: 36,
      color: '#9C27B0'
    },
    {
      id: 8,
      type: 'image',
      src: 'https://picsum.photos/350/250?random=4',
      x: 600,
      y: 300,
      width: 350,
      height: 250
    },
    {
      id: 9,
      type: 'text',
      content: '⚡ Performance optimisée',
      x: -600,
      y: -300,
      fontSize: 26,
      color: '#FFC107'
    },
    {
      id: 10,
      type: 'image',
      src: 'https://picsum.photos/280/350?random=5',
      x: 300,
      y: -400,
      width: 280,
      height: 350
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
    
    // Ajouter une marge pour charger les éléments légèrement hors de l'écran
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
      {/* Contrôles */}
      <div className="controls">
        <button onClick={zoomIn} title="Zoom avant (Ctrl+Molette)">
          <span>🔍+</span>
        </button>
        <button onClick={zoomOut} title="Zoom arrière (Ctrl+Molette)">
          <span>🔍-</span>
        </button>
        <button onClick={centerView} title="Centrer la vue">
          <span>🎯</span>
        </button>
        <button onClick={resetTransform} title="Réinitialiser">
          <span>🔄</span>
        </button>
        <span className="zoom-level">{Math.round(transform.scale * 100)}%</span>
      </div>
      
      {/* Informations */}
      <div className="canvas-info">
        <div>📍 X: {Math.round(transform.x)}, Y: {Math.round(transform.y)}</div>
        <div>🔍 Zoom: {Math.round(transform.scale * 100)}%</div>
        <div className="gesture-hint">
          {isDragging ? '✊ Déplacement...' : '👆 Touchez pour naviguer'}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="instructions">
        <h3>Navigation Tactile</h3>
        <ul>
          <li>👆 <strong>Glisser:</strong> Un doigt pour déplacer</li>
          <li>🤏 <strong>Pincer:</strong> Deux doigts pour zoomer</li>
          <li>🖱️ <strong>Souris:</strong> Glisser + Ctrl+Molette pour zoom</li>
          <li>📱 <strong>Mobile:</strong> Optimisé pour le tactile!</li>
        </ul>
      </div>
      
      {/* Canvas */}
      <div 
        className="infinite-canvas"
        ref={canvasRef}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Grille de fond */}
        <div className="grid-background"></div>
        
        {/* Point central */}
        <div className="center-marker">
          <div className="center-dot"></div>
          <div className="center-label">Origine (0,0)</div>
        </div>
        
        {/* Axes de référence */}
        <div className="axis axis-x"></div>
        <div className="axis axis-y"></div>
        
        {/* Rendu optimisé des éléments visibles uniquement */}
        {canvasItems.map(item => {
          // Optimisation: ne pas rendre les éléments hors de la vue
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

export default InfiniteCanvasOptimized;