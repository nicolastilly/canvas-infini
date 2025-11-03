import React, { useRef, useEffect, useState, useCallback } from 'react';
import './InfiniteCanvas.css';

const InfiniteCanvas = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // État pour la transformation du canvas
    const [transform, setTransform] = useState({
        x: 0,
        y: 0,
        scale: 1
    });

    // État pour le dragging
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [lastTransform, setLastTransform] = useState({ x: 0, y: 0 });

    // État pour le pinch-to-zoom
    const [isPinching, setIsPinching] = useState(false);
    const [initialPinchDistance, setInitialPinchDistance] = useState(0);
    const [initialScale, setInitialScale] = useState(1);

    // Contenu du canvas (exemples)
    const [canvasItems] = useState([
        {
            id: 1,
            type: 'text',
            content: 'Bienvenue dans le canvas infini!',
            x: 100,
            y: 100,
            fontSize: 24,
            color: '#333'
        },
        {
            id: 2,
            type: 'image',
            src: 'https://via.placeholder.com/200x150/4CAF50/ffffff?text=Image+1',
            x: 300,
            y: 200,
            width: 200,
            height: 150
        },
        {
            id: 3,
            type: 'text',
            content: 'Utilisez le tactile pour naviguer',
            x: -200,
            y: -100,
            fontSize: 18,
            color: '#666'
        },
        {
            id: 4,
            type: 'image',
            src: 'https://via.placeholder.com/300x200/2196F3/ffffff?text=Image+2',
            x: -400,
            y: 300,
            width: 300,
            height: 200
        },
        {
            id: 5,
            type: 'text',
            content: 'Pincez pour zoomer',
            x: 500,
            y: -200,
            fontSize: 32,
            color: '#e91e63'
        },
        {
            id: 6,
            type: 'image',
            src: 'https://via.placeholder.com/250x250/FF9800/ffffff?text=Image+3',
            x: -100,
            y: 500,
            width: 250,
            height: 250
        }
    ]);

    // Limites de zoom
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 5;

    // Fonction pour calculer la distance entre deux points tactiles
    const getTouchDistance = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Fonction pour obtenir le centre entre deux points tactiles
    const getTouchCenter = (touches) => {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    };

    // Gestion du début du touch/mouse
    const handlePointerDown = (e) => {
        if (e.touches && e.touches.length === 2) {
            // Début du pinch-to-zoom
            setIsPinching(true);
            setInitialPinchDistance(getTouchDistance(e.touches));
            setInitialScale(transform.scale);
        } else {
            // Début du drag
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            setIsDragging(true);
            setDragStart({ x: clientX, y: clientY });
            setLastTransform({ x: transform.x, y: transform.y });
        }
    };

    // Gestion du mouvement touch/mouse
    const handlePointerMove = (e) => {
        if (e.touches && e.touches.length === 2 && isPinching) {
            // Pinch-to-zoom en cours
            e.preventDefault();
            const currentDistance = getTouchDistance(e.touches);
            const scaleFactor = currentDistance / initialPinchDistance;
            const newScale = Math.min(Math.max(initialScale * scaleFactor, MIN_SCALE), MAX_SCALE);

            // Calculer le centre du pinch pour zoomer vers ce point
            const center = getTouchCenter(e.touches);
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = center.x - rect.left - rect.width / 2;
            const centerY = center.y - rect.top - rect.height / 2;

            setTransform(prev => ({
                ...prev,
                scale: newScale
            }));
        } else if (isDragging && !isPinching) {
            // Drag en cours
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const deltaX = clientX - dragStart.x;
            const deltaY = clientY - dragStart.y;

            setTransform(prev => ({
                ...prev,
                x: lastTransform.x + deltaX,
                y: lastTransform.y + deltaY
            }));
        }
    };

    // Gestion de la fin du touch/mouse
    const handlePointerUp = () => {
        setIsDragging(false);
        setIsPinching(false);
    };

    // Gestion du zoom avec la molette
    const handleWheel = (e) => {
        e.preventDefault();
        const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(transform.scale * scaleDelta, MIN_SCALE), MAX_SCALE);

        // Zoomer vers la position de la souris
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const scaleRatio = newScale / transform.scale;
        const newX = mouseX - (mouseX - transform.x) * scaleRatio;
        const newY = mouseY - (mouseY - transform.y) * scaleRatio;

        setTransform({
            x: newX,
            y: newY,
            scale: newScale
        });
    };

    // Fonction pour réinitialiser la vue
    const resetView = () => {
        setTransform({ x: 0, y: 0, scale: 1 });
    };

    // Fonction pour centrer la vue
    const centerView = () => {
        setTransform(prev => ({ ...prev, x: 0, y: 0 }));
    };

    // Configuration des event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Touch events
        container.addEventListener('touchstart', handlePointerDown, { passive: false });
        container.addEventListener('touchmove', handlePointerMove, { passive: false });
        container.addEventListener('touchend', handlePointerUp);

        // Mouse events
        container.addEventListener('mousedown', handlePointerDown);
        container.addEventListener('mousemove', handlePointerMove);
        container.addEventListener('mouseup', handlePointerUp);
        container.addEventListener('mouseleave', handlePointerUp);

        // Wheel event
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('touchstart', handlePointerDown);
            container.removeEventListener('touchmove', handlePointerMove);
            container.removeEventListener('touchend', handlePointerUp);
            container.removeEventListener('mousedown', handlePointerDown);
            container.removeEventListener('mousemove', handlePointerMove);
            container.removeEventListener('mouseup', handlePointerUp);
            container.removeEventListener('mouseleave', handlePointerUp);
            container.removeEventListener('wheel', handleWheel);
        };
    }, [isDragging, isPinching, dragStart, lastTransform, transform.scale, initialPinchDistance, initialScale]);

    return (
        <div className="infinite-canvas-container" ref={containerRef}>
            <div className="controls">
                <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, MAX_SCALE) }))}>
                    Zoom +
                </button>
                <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(prev.scale * 0.8, MIN_SCALE) }))}>
                    Zoom -
                </button>
                <button onClick={centerView}>Centrer</button>
                <button onClick={resetView}>Réinitialiser</button>
                <span className="zoom-level">{Math.round(transform.scale * 100)}%</span>
            </div>

            <div className="canvas-info">
                <div>Position: X: {Math.round(transform.x)}, Y: {Math.round(transform.y)}</div>
                <div>Zoom: {Math.round(transform.scale * 100)}%</div>
            </div>

            <div
                className="infinite-canvas"
                ref={canvasRef}
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                {/* Grille de fond pour visualiser le mouvement */}
                <div className="grid-background"></div>

                {/* Rendu des éléments du canvas */}
                {canvasItems.map(item => {
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
                                    userSelect: 'none'
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
                                alt={`Canvas item ${item.id}`}
                                className="canvas-image"
                                style={{
                                    left: item.x,
                                    top: item.y,
                                    width: item.width,
                                    height: item.height,
                                    position: 'absolute',
                                    userSelect: 'none',
                                    pointerEvents: 'none'
                                }}
                                draggable={false}
                            />
                        );
                    }
                    return null;
                })}

                {/* Point central de référence */}
                <div className="center-marker">
                    <div className="center-dot"></div>
                    <div className="center-label">Centre (0,0)</div>
                </div>
            </div>
        </div>
    );
};

export default InfiniteCanvas;