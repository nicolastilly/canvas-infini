import { useState, useEffect, useRef, useCallback } from 'react';

// Hook personnalisé pour gérer les gestes tactiles et souris avec dessin intégré
export const useGesturesWithDrawing = (containerRef, options = {}) => {
  const {
    minScale = 0.1,
    maxScale = 5,
    scaleSensitivity = 0.01,
    smoothing = false, // Désactivé par défaut pour plus de réactivité
    enableInertia = true,
    inertiaFriction = 0.95
  } = options;

  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1
  });

  const [drawingPaths, setDrawingPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  const gestureState = useRef({
    isDragging: false,
    isPinching: false,
    dragStart: { x: 0, y: 0 },
    lastTransform: { x: 0, y: 0 },
    initialPinchDistance: 0,
    initialScale: 1,
    velocity: { x: 0, y: 0 },
    lastMoveTime: 0,
    lastPosition: { x: 0, y: 0 },
    animationFrame: null,
    // Pour le dessin
    currentDrawingPath: [],
    lastDrawPoint: null
  });

  // Obtenir la position du monde au centre de l'écran
  const getCenterWorldPosition = useCallback((tx, ty, scale) => {
    // Le centre de l'écran en coordonnées monde
    const worldX = -tx / scale;
    const worldY = -ty / scale;
    
    return { x: worldX, y: worldY };
  }, []);

  // Calcul de la distance entre deux points tactiles
  const getTouchDistance = useCallback((touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calcul du centre entre deux points tactiles
  const getTouchCenter = useCallback((touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }, []);

  // Gestion de l'inertie
  const applyInertia = useCallback(() => {
    const state = gestureState.current;
    
    if (!enableInertia || state.isDragging || state.isPinching) {
      return;
    }

    const velocityMagnitude = Math.sqrt(
      state.velocity.x * state.velocity.x + 
      state.velocity.y * state.velocity.y
    );

    if (velocityMagnitude < 0.1) {
      state.velocity.x = 0;
      state.velocity.y = 0;
      return;
    }

    setTransform(prev => ({
      ...prev,
      x: prev.x + state.velocity.x,
      y: prev.y + state.velocity.y
    }));

    state.velocity.x *= inertiaFriction;
    state.velocity.y *= inertiaFriction;

    state.animationFrame = requestAnimationFrame(applyInertia);
  }, [enableInertia, inertiaFriction]);

  // Gestionnaire pour le début du geste
  const handleGestureStart = useCallback((e) => {
    const state = gestureState.current;
    
    // Annuler l'inertie en cours
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }
    
    state.velocity = { x: 0, y: 0 };

    if (e.touches && e.touches.length === 2) {
      // Pinch-to-zoom
      state.isPinching = true;
      setIsPinching(true);
      state.initialPinchDistance = getTouchDistance(e.touches);
      state.initialScale = transform.scale;
    } else {
      // Drag
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      state.isDragging = true;
      setIsDragging(true);
      state.dragStart = { x: clientX, y: clientY };
      state.lastTransform = { x: transform.x, y: transform.y };
      state.lastPosition = { x: clientX, y: clientY };
      state.lastMoveTime = Date.now();
      
      // Commencer un nouveau segment de dessin si activé
      if (isDrawingEnabled) {
        const centerPoint = getCenterWorldPosition(transform.x, transform.y, transform.scale);
        console.log('🎨 START drawing at:', centerPoint);
        state.currentDrawingPath = [centerPoint];
        state.lastDrawPoint = centerPoint;
        setCurrentPath([centerPoint]);
      }
    }
  }, [transform, getTouchDistance, getCenterWorldPosition, isDrawingEnabled]);

  // Gestionnaire pour le mouvement du geste
  const handleGestureMove = useCallback((e) => {
    const state = gestureState.current;

    if (e.touches && e.touches.length === 2 && state.isPinching) {
      e.preventDefault();
      
      const currentDistance = getTouchDistance(e.touches);
      const scaleFactor = currentDistance / state.initialPinchDistance;
      const newScale = Math.min(Math.max(state.initialScale * scaleFactor, minScale), maxScale);
      
      const center = getTouchCenter(e.touches);
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = center.x - rect.left - rect.width / 2;
      const centerY = center.y - rect.top - rect.height / 2;
      
      const scaleRatio = newScale / transform.scale;
      const adjustedX = centerX - (centerX - transform.x) * scaleRatio;
      const adjustedY = centerY - (centerY - transform.y) * scaleRatio;
      
      setTransform({
        x: adjustedX,
        y: adjustedY,
        scale: newScale
      });
    } else if (state.isDragging && !state.isPinching) {
      e.preventDefault();
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - state.dragStart.x;
      const deltaY = clientY - state.dragStart.y;
      
      const newX = state.lastTransform.x + deltaX;
      const newY = state.lastTransform.y + deltaY;
      
      // Calculer la vélocité pour l'inertie
      if (enableInertia) {
        const currentTime = Date.now();
        const timeDelta = currentTime - state.lastMoveTime;
        
        if (timeDelta > 0) {
          state.velocity.x = (clientX - state.lastPosition.x) / timeDelta * 16;
          state.velocity.y = (clientY - state.lastPosition.y) / timeDelta * 16;
        }
        
        state.lastPosition = { x: clientX, y: clientY };
        state.lastMoveTime = currentTime;
      }
      
      // Ajouter au dessin si activé
      if (isDrawingEnabled && state.isDragging) {
        const centerPoint = getCenterWorldPosition(newX, newY, transform.scale);
        
        if (state.lastDrawPoint) {
          const dx = centerPoint.x - state.lastDrawPoint.x;
          const dy = centerPoint.y - state.lastDrawPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Ajouter le point seulement s'il est assez éloigné
          const minDistance = 2;
          if (distance >= minDistance) {
            state.currentDrawingPath.push(centerPoint);
            state.lastDrawPoint = centerPoint;
            console.log('📍 Point added, total:', state.currentDrawingPath.length, 'at:', centerPoint);
            
            // Mettre à jour le chemin en cours pour le rendu en temps réel
            setCurrentPath([...state.currentDrawingPath]);
          }
        }
      }
      
      // Mettre à jour la transformation
      setTransform({
        x: newX,
        y: newY,
        scale: transform.scale
      });
    }
  }, [transform, minScale, maxScale, containerRef, getTouchDistance, getTouchCenter, enableInertia, isDrawingEnabled, getCenterWorldPosition]);

  // Gestionnaire pour la fin du geste
  const handleGestureEnd = useCallback(() => {
    const state = gestureState.current;
    
    console.log('=== handleGestureEnd ===');
    console.log('isDrawingEnabled:', isDrawingEnabled);
    console.log('state.isDragging:', state.isDragging);
    console.log('currentDrawingPath length:', state.currentDrawingPath.length);
    console.log('currentDrawingPath:', state.currentDrawingPath);
    
    // Sauvegarder le chemin de dessin si nécessaire (au moins 2 points pour tracer une ligne)
    if (isDrawingEnabled && state.currentDrawingPath.length > 1) {
      console.log('✅ SAVING PATH with', state.currentDrawingPath.length, 'points');
      const newPath = {
        points: [...state.currentDrawingPath],
        strokeWidth: 3,
        strokeColor: 'rgba(0, 0, 0, 0.8)'
      };
      console.log('New path object:', newPath);
      
      setDrawingPaths(prev => {
        const updated = [...prev, newPath];
        console.log('Updated drawingPaths (now has', updated.length, 'paths)');
        return updated;
      });
    } else {
      console.log('❌ NOT SAVING - Reason:', 
        !isDrawingEnabled ? 'drawing disabled' : 
        state.currentDrawingPath.length <= 1 ? `only ${state.currentDrawingPath.length} point(s)` : 'unknown');
    }
    
    // Réinitialiser le chemin en cours
    state.currentDrawingPath = [];
    state.lastDrawPoint = null;
    setCurrentPath([]);
    
    if (state.isDragging && enableInertia) {
      applyInertia();
    }
    
    state.isDragging = false;
    state.isPinching = false;
    setIsDragging(false);
    setIsPinching(false);
  }, [enableInertia, applyInertia, isDrawingEnabled]);

  // Gestionnaire pour la molette de souris
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    
    if (e.ctrlKey || e.metaKey) {
      const scaleDelta = e.deltaY > 0 ? (1 - scaleSensitivity * 10) : (1 + scaleSensitivity * 10);
      const newScale = Math.min(Math.max(transform.scale * scaleDelta, minScale), maxScale);
      
      const scaleRatio = newScale / transform.scale;
      const newX = mouseX - (mouseX - transform.x) * scaleRatio;
      const newY = mouseY - (mouseY - transform.y) * scaleRatio;
      
      setTransform({
        x: newX,
        y: newY,
        scale: newScale
      });
    } else {
      setTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [transform, containerRef, minScale, maxScale, scaleSensitivity]);

  // Fonctions utilitaires
  const resetTransform = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const centerView = useCallback(() => {
    setTransform(prev => ({ ...prev, x: 0, y: 0 }));
  }, []);

  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, maxScale)
    }));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, minScale)
    }));
  }, [minScale]);

  const clearDrawing = useCallback(() => {
    setDrawingPaths([]);
    setCurrentPath([]);
    gestureState.current.currentDrawingPath = [];
    gestureState.current.lastDrawPoint = null;
  }, []);

  const undoLastStroke = useCallback(() => {
    setDrawingPaths(prev => prev.slice(0, -1));
  }, []);

  // Configuration des event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const eventOptions = { passive: false };

    // Touch events
    container.addEventListener('touchstart', handleGestureStart, eventOptions);
    container.addEventListener('touchmove', handleGestureMove, eventOptions);
    container.addEventListener('touchend', handleGestureEnd);
    container.addEventListener('touchcancel', handleGestureEnd);
    
    // Mouse events
    container.addEventListener('mousedown', handleGestureStart);
    container.addEventListener('mousemove', handleGestureMove);
    container.addEventListener('mouseup', handleGestureEnd);
    container.addEventListener('mouseleave', handleGestureEnd);
    
    // Wheel event
    container.addEventListener('wheel', handleWheel, eventOptions);

    return () => {
      container.removeEventListener('touchstart', handleGestureStart);
      container.removeEventListener('touchmove', handleGestureMove);
      container.removeEventListener('touchend', handleGestureEnd);
      container.removeEventListener('touchcancel', handleGestureEnd);
      container.removeEventListener('mousedown', handleGestureStart);
      container.removeEventListener('mousemove', handleGestureMove);
      container.removeEventListener('mouseup', handleGestureEnd);
      container.removeEventListener('mouseleave', handleGestureEnd);
      container.removeEventListener('wheel', handleWheel);
      
      if (gestureState.current.animationFrame) {
        cancelAnimationFrame(gestureState.current.animationFrame);
      }
    };
  }, [handleGestureStart, handleGestureMove, handleGestureEnd, handleWheel]);

  return {
    transform,
    setTransform,
    resetTransform,
    centerView,
    zoomIn,
    zoomOut,
    isDragging,
    isPinching,
    // Drawing
    drawingPaths,
    currentPath,
    isDrawingEnabled,
    setIsDrawingEnabled,
    clearDrawing,
    undoLastStroke,
    hasDrawings: drawingPaths.length > 0,
    drawingCount: drawingPaths.length
  };
};

export default useGesturesWithDrawing;
