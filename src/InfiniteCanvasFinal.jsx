import React, { useRef, useState, useEffect } from 'react';
import useGesturesWithDrawing from './useGesturesWithDrawing';
import './InfiniteCanvas.css';

const InfiniteCanvasFinal = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Utilisation du hook intégré gestes + dessin
  const {
    transform,
    resetTransform,
    centerView,
    zoomIn,
    zoomOut,
    isDragging,
    // Drawing
    drawingPaths,
    currentPath,
    isDrawingEnabled,
    setIsDrawingEnabled,
    clearDrawing,
    undoLastStroke,
    hasDrawings,
    drawingCount
  } = useGesturesWithDrawing(containerRef, {
    minScale: 0.1,
    maxScale: 5,
    smoothing: false,
    enableInertia: false,
    scaleSensitivity: 0.01
  });

  // Debug: afficher les paths
  useEffect(() => {
    console.log('🔄 drawingPaths updated:', drawingPaths.length, 'paths');
    console.log('Paths:', drawingPaths);
  }, [drawingPaths]);

  useEffect(() => {
    console.log('🔄 currentPath updated:', currentPath.length, 'points');
  }, [currentPath]);

  // Contenu du canvas
  const [canvasItems] = useState([
    {
      id: 1,
      type: 'text',
      content: '🚀 Canvas Infini avec Traces',
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
      content: '✏️ Déplacez = Dessinez!',
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
      content: '🎨 Traces persistantes',
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

  // Fonction pour rendre un chemin de dessin
  const renderPath = (path, index, isTemporary = false) => {
    const points = path.points || path;
    if (!points || points.length < 2) return null;

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const next = points[i + 1];

      if (next) {
        const cp = curr;
        const end = {
          x: (curr.x + next.x) / 2,
          y: (curr.y + next.y) / 2
        };
        d += ` Q ${cp.x} ${cp.y} ${end.x} ${end.y}`;
      } else {
        d += ` L ${curr.x} ${curr.y}`;
      }
    }

    // Déterminer la couleur et l'épaisseur
    const strokeColor = (path.strokeColor) || 'rgba(0, 0, 0, 0.8)';
    const strokeWidth = (path.strokeWidth) || 3;

    return (
      <path
        key={isTemporary ? 'current-path' : `path-${index}`}
        d={d}
        stroke={strokeColor}
        strokeWidth={strokeWidth / transform.scale}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pointerEvents="none"
        opacity={isTemporary ? 0.7 : 1}
      />
    );
  };

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
          onClick={undoLastStroke}
          title="Annuler"
          disabled={!hasDrawings}
        >
          <span>↶</span>
        </button>
        <button
          onClick={clearDrawing}
          title="Tout effacer"
          disabled={!hasDrawings}
        >
          <span>🗑️</span>
        </button>
        {hasDrawings && (
          <span className="drawing-count">{drawingCount} trait{drawingCount > 1 ? 's' : ''}</span>
        )}
        <span style={{ marginLeft: '10px', fontSize: '11px', color: '#666' }}>
          Debug: {drawingPaths.length} paths, current: {currentPath.length} pts
        </span>
      </div>

      {/* Informations */}
      <div className="canvas-info">
        <div>📍 Position: X:{Math.round(-transform.x / transform.scale)}, Y:{Math.round(-transform.y / transform.scale)}</div>
        <div>🔍 Zoom: {Math.round(transform.scale * 100)}%</div>
        <div className="gesture-hint">
          {isDragging ? (
            isDrawingEnabled ? '✏️ Trace en cours...' : '✊ Déplacement...'
          ) : (
            '👆 Glissez pour naviguer'
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>🎨 Canvas + Dessin</h3>
        <ul>
          <li><strong>Glisser:</strong> Déplace + Dessine</li>
          <li><strong>Pincer:</strong> Zoom tactile</li>
          <li><strong>✏️ Actif:</strong> Le centre trace</li>
          <li><strong>Traces:</strong> Persistent partout</li>
        </ul>
      </div>

      {/* Indicateur central - point de référence du tracé */}
      {isDrawingEnabled && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '20px',
            height: '20px',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        >
          {/* Cercle externe pulsant */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '2px solid rgba(255, 0, 0, 0.6)',
              transform: 'translate(-50%, -50%)',
              animation: isDragging ? 'pulse 0.5s ease-in-out infinite' : 'none'
            }}
          />
          {/* Point central */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isDragging ? 'rgba(255, 0, 0, 0.9)' : 'rgba(255, 0, 0, 0.5)',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
            }}
          />
          {/* Lignes de croix */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '30px',
              height: '1px',
              backgroundColor: 'rgba(255, 0, 0, 0.4)',
              transform: 'translate(-50%, -50%)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '1px',
              height: '30px',
              backgroundColor: 'rgba(255, 0, 0, 0.4)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
      )}

      {/* Couche de dessin SVG */}
      <svg
        className="drawing-layer"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 10
        }}
      >
        <g
          transform={`translate(${containerRef.current?.clientWidth / 2 || 500}, ${containerRef.current?.clientHeight / 2 || 500})`}
        >
          <g
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
          >
            {drawingPaths.map((path, index) => renderPath(path, index, false))}
            {currentPath.length > 1 && renderPath(currentPath, -1, true)}
          </g>
        </g>
      </svg>

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

export default InfiniteCanvasFinal;