import { useState, useEffect, useRef, useCallback } from 'react';

// Hook personnalisé pour gérer les gestes tactiles et souris
export const useGestures = (containerRef, options = {}) => {
  const {
    minScale = 0.1,
    maxScale = 5,
    scaleSensitivity = 0.01,
    smoothing = true,
    enableInertia = true,
    inertiaFriction = 0.95
  } = options;

  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1
  });

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
    animationFrame: null
  });

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
      state.initialPinchDistance = getTouchDistance(e.touches);
      state.initialScale = transform.scale;
    } else {
      // Drag
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      state.isDragging = true;
      state.dragStart = { x: clientX, y: clientY };
      state.lastTransform = { x: transform.x, y: transform.y };
      state.lastPosition = { x: clientX, y: clientY };
      state.lastMoveTime = Date.now();
    }
  }, [transform, getTouchDistance]);

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
      
      // Ajuster la position pour zoomer vers le centre du pinch
      const scaleRatio = newScale / transform.scale;
      const adjustedX = centerX - (centerX - transform.x) * scaleRatio;
      const adjustedY = centerY - (centerY - transform.y) * scaleRatio;
      
      setTransform({
        x: smoothing ? transform.x * 0.8 + adjustedX * 0.2 : adjustedX,
        y: smoothing ? transform.y * 0.8 + adjustedY * 0.2 : adjustedY,
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
      
      setTransform(prev => ({
        ...prev,
        x: smoothing ? prev.x * 0.8 + newX * 0.2 : newX,
        y: smoothing ? prev.y * 0.8 + newY * 0.2 : newY
      }));
    }
  }, [transform, minScale, maxScale, containerRef, getTouchDistance, getTouchCenter, smoothing, enableInertia]);

  // Gestionnaire pour la fin du geste
  const handleGestureEnd = useCallback(() => {
    const state = gestureState.current;
    
    if (state.isDragging && enableInertia) {
      applyInertia();
    }
    
    state.isDragging = false;
    state.isPinching = false;
  }, [enableInertia, applyInertia]);

  // Gestionnaire pour la molette de souris
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    
    // Utiliser Ctrl/Cmd + wheel pour le zoom, sinon pour le pan
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
      // Pan avec la molette
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

  const setScale = useCallback((scale) => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(scale, minScale), maxScale)
    }));
  }, [minScale, maxScale]);

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
      // Cleanup des event listeners
      container.removeEventListener('touchstart', handleGestureStart);
      container.removeEventListener('touchmove', handleGestureMove);
      container.removeEventListener('touchend', handleGestureEnd);
      container.removeEventListener('touchcancel', handleGestureEnd);
      container.removeEventListener('mousedown', handleGestureStart);
      container.removeEventListener('mousemove', handleGestureMove);
      container.removeEventListener('mouseup', handleGestureEnd);
      container.removeEventListener('mouseleave', handleGestureEnd);
      container.removeEventListener('wheel', handleWheel);
      
      // Cleanup de l'animation frame
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
    setScale,
    isDragging: gestureState.current.isDragging,
    isPinching: gestureState.current.isPinching
  };
};

export default useGestures;