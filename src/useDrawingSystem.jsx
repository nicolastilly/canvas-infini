import { useRef, useCallback, useEffect, useState } from 'react';

export const useDrawingSystem = (containerRef, transform, isDragging) => {
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(true);
  const [paths, setPaths] = useState([]);
  const currentPathRef = useRef([]);
  const lastPointRef = useRef(null);
  const isDrawingRef = useRef(false);
  
  // Configuration du dessin
  const config = {
    strokeWidth: 3,
    strokeColor: 'rgba(0, 0, 0, 0.8)',
    minDistance: 2, // Distance minimale entre les points pour éviter les doublons
  };

  // Convertir les coordonnées écran en coordonnées du monde (canvas infini)
  const screenToWorld = useCallback((screenX, screenY) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Position relative au centre du conteneur
    const relativeX = screenX - rect.left - centerX;
    const relativeY = screenY - rect.top - centerY;
    
    // Appliquer l'inverse de la transformation pour obtenir les coordonnées dans le monde
    const worldX = (relativeX - transform.x) / transform.scale;
    const worldY = (relativeY - transform.y) / transform.scale;
    
    return { x: worldX, y: worldY };
  }, [transform, containerRef]);

  // Convertir les coordonnées du monde en coordonnées écran
  const worldToScreen = useCallback((worldX, worldY) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Appliquer la transformation
    const screenX = worldX * transform.scale + transform.x + centerX;
    const screenY = worldY * transform.scale + transform.y + centerY;
    
    return { x: screenX, y: screenY };
  }, [transform, containerRef]);

  // Commencer un nouveau trait
  const startPath = useCallback((screenX, screenY) => {
    if (!isDrawingEnabled || !isDragging) return;
    
    const worldPoint = screenToWorld(screenX, screenY);
    currentPathRef.current = [worldPoint];
    lastPointRef.current = worldPoint;
    isDrawingRef.current = true;
  }, [isDrawingEnabled, isDragging, screenToWorld]);

  // Ajouter un point au trait en cours
  const addPoint = useCallback((screenX, screenY) => {
    if (!isDrawingEnabled || !isDragging || !isDrawingRef.current) return;
    if (!lastPointRef.current) return;
    
    const worldPoint = screenToWorld(screenX, screenY);
    
    // Calculer la distance depuis le dernier point
    const dx = worldPoint.x - lastPointRef.current.x;
    const dy = worldPoint.y - lastPointRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Ajouter le point seulement s'il est assez éloigné du précédent
    if (distance >= config.minDistance / transform.scale) {
      currentPathRef.current.push(worldPoint);
      lastPointRef.current = worldPoint;
    }
  }, [isDrawingEnabled, isDragging, screenToWorld, transform.scale]);

  // Terminer le trait en cours
  const endPath = useCallback(() => {
    if (currentPathRef.current.length > 1) {
      setPaths(prevPaths => [...prevPaths, {
        points: [...currentPathRef.current],
        strokeWidth: config.strokeWidth,
        strokeColor: config.strokeColor
      }]);
    }
    
    currentPathRef.current = [];
    lastPointRef.current = null;
    isDrawingRef.current = false;
  }, []);

  // Effacer tous les dessins
  const clearAll = useCallback(() => {
    setPaths([]);
    currentPathRef.current = [];
    lastPointRef.current = null;
    isDrawingRef.current = false;
  }, []);

  // Annuler le dernier trait
  const undo = useCallback(() => {
    setPaths(prevPaths => prevPaths.slice(0, -1));
  }, []);

  // Fonction pour rendre un chemin en SVG
  const renderPath = useCallback((path, index) => {
    if (!path.points || path.points.length < 2) return null;
    
    // Construire le chemin SVG
    let d = `M ${path.points[0].x} ${path.points[0].y}`;
    
    // Utiliser des courbes de Bézier quadratiques pour un rendu plus lisse
    for (let i = 1; i < path.points.length; i++) {
      const prev = path.points[i - 1];
      const curr = path.points[i];
      const next = path.points[i + 1];
      
      if (next) {
        // Point de contrôle au point actuel
        const cp = curr;
        // Point final entre le point actuel et le suivant
        const end = {
          x: (curr.x + next.x) / 2,
          y: (curr.y + next.y) / 2
        };
        d += ` Q ${cp.x} ${cp.y} ${end.x} ${end.y}`;
      } else {
        // Dernier segment
        d += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return (
      <path
        key={`path-${index}`}
        d={d}
        stroke={path.strokeColor}
        strokeWidth={path.strokeWidth / transform.scale}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pointerEvents="none"
      />
    );
  }, [transform.scale]);

  // Fonction pour rendre le chemin en cours
  const renderCurrentPath = useCallback(() => {
    if (!isDrawingRef.current || currentPathRef.current.length < 2) return null;
    
    const points = currentPathRef.current;
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return (
      <path
        key="current-path"
        d={d}
        stroke={config.strokeColor}
        strokeWidth={config.strokeWidth / transform.scale}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        pointerEvents="none"
      />
    );
  }, [transform.scale]);

  // Composant SVG pour le rendu des dessins
  const DrawingLayer = useCallback(() => (
    <svg
      className="drawing-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible'
      }}
    >
      <g
        transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
        style={{ transformOrigin: 'center' }}
      >
        {paths.map((path, index) => renderPath(path, index))}
        {renderCurrentPath()}
      </g>
    </svg>
  ), [paths, transform, renderPath, renderCurrentPath]);

  return {
    // État
    isDrawingEnabled,
    setIsDrawingEnabled,
    paths,
    
    // Actions
    startPath,
    addPoint,
    endPath,
    clearAll,
    undo,
    
    // Composant de rendu
    DrawingLayer,
    
    // Utilitaires
    screenToWorld,
    worldToScreen,
    
    // Info
    hasDrawings: paths.length > 0,
    drawingCount: paths.length
  };
};

export default useDrawingSystem;