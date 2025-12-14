"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { NODE_COLORS, CENTER_COLOR } from "../lib/colors";
import { calculateNewNodePosition, adjustNodesForNewNode, validateAndFixOverlaps, estimateNodeDimensions, calculateAndStoreBounds, pushNodesAwayFromDragged, getNodeBounds, areNodesTooClose } from "../lib/positioning";
import { INITIAL_CENTER_NODE } from "../lib/constants";
import { initializeTicTacToeSession, convertConceptGraphToNodes, getGoal } from "../lib/api";
export function useMindMap(initialText, isDarkMode = false, onStartNewJourney) {
    // Node state - initialize center node at viewport center
    const [nodes, setNodes] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [goal, setGoal] = useState(null);
    const [showCongratulations, setShowCongratulations] = useState(false);
    const containerRef = useRef(null);
    const initializationInProgress = useRef(false);
    const [nodeWeights, setNodeWeights] = useState(new Map());
    const [totalWeight, setTotalWeight] = useState(0);
    // Initialize with tic tac toe concept graph
    useEffect(() => {
        if (containerRef.current && !isInitialized && !initializationInProgress.current) {
            initializationInProgress.current = true;
            const rect = containerRef.current.getBoundingClientRect();
            const initializeWithBackend = async () => {
                setIsLoading(true);
                try {
                    // Use initialText (user input) as the prompt, or fallback to default
                    const prompt = initialText || undefined;
                    const { sessionId: newSessionId, conceptGraph } = await initializeTicTacToeSession(prompt);
                    setSessionId(newSessionId);
                    // Fetch the goal after getting the session
                    try {
                        const goalResponse = await getGoal(newSessionId);
                        setGoal(goalResponse);
                    }
                    catch {
                        // Goal fetch failed, continue without goal
                    }
                    const { centerNode, childNodes } = convertConceptGraphToNodes(conceptGraph);
                    // Create center node (position in unscaled coordinates)
                    const centerNodeObj = calculateAndStoreBounds({
                        ...INITIAL_CENTER_NODE,
                        x: rect.width / 2,
                        y: rect.height / 2,
                        content: centerNode,
                        color: CENTER_COLOR.light.replace(/border-\w+-\d+/g, 'border-slate-600').replace(/bg-\w+-\d+\/\d+/g, 'bg-slate-800/90').replace(/text-\w+-\d+/g, 'text-slate-100'), conceptId: centerNode.conceptId,
                        weight: centerNode.weight,
                        completed: centerNode.completed,
                    });
                    // Create child nodes using simple tree structure
                    const childNodeObjs = [];
                    const nodeMap = new Map();
                    nodeMap.set(centerNodeObj.conceptId, centerNodeObj);
                    const sortedChildNodes = [...childNodes].sort((a, b) => a.level - b.level);
                    sortedChildNodes.forEach((content) => {
                        let parentNode = centerNodeObj;
                        if (content.parentConceptId) {
                            const foundParent = nodeMap.get(content.parentConceptId);
                            if (foundParent) {
                                parentNode = foundParent;
                            }
                        }
                        const siblings = childNodeObjs.filter(n => n.parentId === parentNode.id);
                        // Use the positioning system to calculate safe position that accounts for actual node dimensions
                        const position = calculateNewNodePosition(parentNode, siblings, [centerNodeObj, ...childNodeObjs], content);
                        // Assign colors (use dark mode versions)
                        const nodeColor = parentNode === centerNodeObj
                            ? NODE_COLORS[siblings.length % NODE_COLORS.length].light.replace(/border-\w+-300/g, (match) => match.replace('300', '700')).replace(/bg-\w+-50\/80/g, (match) => match.replace('50/80', '950/50')).replace(/text-\w+-900/g, (match) => match.replace('900', '100'))
                            : parentNode.color;
                        // Create node with calculated position - the positioning system already accounts for collisions
                        // But we'll validate it one more time to be sure
                        const childNode = calculateAndStoreBounds({
                            id: crypto.randomUUID(),
                            content,
                            x: position.x,
                            y: position.y,
                            color: nodeColor,
                            parentId: parentNode.id,
                            conceptId: content.conceptId,
                            weight: content.weight,
                            completed: content.completed,
                        });
                        // Check if this node collides with any existing nodes
                        const allExistingNodes = [centerNodeObj, ...childNodeObjs];
                        const childBounds = childNode.bounds;
                        let hasCollision = false;
                        for (const existingNode of allExistingNodes) {
                            const existingBounds = getNodeBounds(existingNode);
                            if (areNodesTooClose(childBounds, existingBounds)) {
                                hasCollision = true;
                                break;
                            }
                        }
                        // If collision detected, recalculate position with all existing nodes
                        let finalNode = childNode;
                        if (hasCollision) {
                            const safePosition = calculateNewNodePosition(parentNode, siblings, allExistingNodes, content);
                            finalNode = calculateAndStoreBounds({
                                ...childNode,
                                x: safePosition.x,
                                y: safePosition.y,
                            });
                        }
                        childNodeObjs.push(finalNode);
                        nodeMap.set(content.conceptId, finalNode);
                    });
                    // Initialize weights from backend data
                    const initialWeights = new Map();
                    initialWeights.set(centerNode.conceptId, centerNode.weight || 0);
                    childNodes.forEach(child => {
                        initialWeights.set(child.conceptId, child.weight || 0);
                    });
                    setNodeWeights(initialWeights);
                    // Calculate initial total weight
                    const initialTotal = Array.from(initialWeights.values()).reduce((sum, weight) => sum + weight, 0);
                    setTotalWeight(initialTotal);
                    console.log(`Initialized with total weight: ${initialTotal}`);
                    // Validate all nodes before adding to ensure no collisions
                    const allInitialNodes = [centerNodeObj, ...childNodeObjs];
                    const validatedNodes = validateAndFixOverlaps(allInitialNodes);
                    // Start with just the center node
                    setNodes([validatedNodes[0]]);
                    // Add child nodes one by one with delays, but use pre-validated positions
                    const validatedChildNodes = validatedNodes.slice(1);
                    validatedChildNodes.forEach((childNode, index) => {
                        setTimeout(() => {
                            setNodes(prevNodes => {
                                // Use the pre-validated position to avoid collisions
                                const existingNode = prevNodes.find(n => n.id === childNode.id);
                                if (existingNode) {
                                    // Node already exists, just return current state
                                    return prevNodes;
                                }
                                return [...prevNodes, childNode];
                            });
                            // Add to newly created nodes for animation
                            setNewlyCreatedNodes(prev => new Set([...prev, childNode.id]));
                            // Remove animation after duration
                            setTimeout(() => {
                                setNewlyCreatedNodes(prev => {
                                    const updated = new Set(prev);
                                    updated.delete(childNode.id);
                                    return updated;
                                });
                            }, 500);
                        }, (index + 1) * 300); // 300ms delay between each node
                    });
                }
                catch {
                    // Fallback to default initialization
                    setNodes([
                        calculateAndStoreBounds({
                            ...INITIAL_CENTER_NODE,
                            x: rect.width / 2,
                            y: rect.height / 2,
                            content: { text: initialText || "Tic Tac Toe Game", header: "Game Concept" },
                            color: CENTER_COLOR.light.replace(/border-\w+-\d+/g, 'border-slate-600').replace(/bg-\w+-\d+\/\d+/g, 'bg-slate-800/90').replace(/text-\w+-\d+/g, 'text-slate-100'),
                            conceptId: "fallback",
                        }),
                    ]);
                }
                finally {
                    setIsLoading(false);
                    setIsInitialized(true);
                    initializationInProgress.current = false;
                }
            };
            initializeWithBackend();
        }
    }, [initialText, isInitialized]);
    // Drag state
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isPanningBackground, setIsPanningBackground] = useState(false);
    const [backgroundOffset, setBackgroundOffset] = useState({ x: 0, y: 0 });
    const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(1);
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 3;
    // Animation state
    const [newlyCreatedNodes, setNewlyCreatedNodes] = useState(new Set());
    const [updatedNodes, setUpdatedNodes] = useState(new Set());
    const handleFinish = useCallback(() => {
        setShowCongratulations(true);
    }, []);
    const handleCloseCongratulations = useCallback(() => {
        setShowCongratulations(false);
        if (onStartNewJourney) {
            onStartNewJourney();
        }
    }, [onStartNewJourney]);
    // Node management
    const addNode = useCallback((parentId, content) => {
        setNodes((prevNodes) => {
            const parent = prevNodes.find((n) => n.id === parentId);
            if (!parent)
                return prevNodes;
            const siblings = prevNodes.filter((n) => n.parentId === parentId);
            let nodeColor;
            if (parent.parentId === null) {
                // This is a first-level child of the center node - assign a unique color
                const usedColorIndices = new Set(prevNodes
                    .filter((n) => n.parentId === "1")
                    .map((n) => NODE_COLORS.findIndex((c) => n.color.includes(c.light.split(" ")[0].replace("border-", ""))))
                    .filter((i) => i !== -1));
                let colorIndex = 0;
                while (usedColorIndices.has(colorIndex) &&
                    colorIndex < NODE_COLORS.length) {
                    colorIndex++;
                }
                if (colorIndex >= NODE_COLORS.length) {
                    colorIndex = Math.floor(Math.random() * NODE_COLORS.length);
                }
                nodeColor = NODE_COLORS[colorIndex].light.replace(/border-\w+-300/g, (match) => match.replace('300', '700')).replace(/bg-\w+-50\/80/g, (match) => match.replace('50/80', '950/50')).replace(/text-\w+-900/g, (match) => match.replace('900', '100'));
            }
            else {
                // This is a deeper level node - inherit parent's color
                nodeColor = parent.color;
            }
            const position = calculateNewNodePosition(parent, siblings, prevNodes, content);
            const newNode = calculateAndStoreBounds({
                id: crypto.randomUUID(),
                content,
                x: position.x,
                y: position.y,
                color: nodeColor,
                parentId,
            });
            // Calculate new node dimensions from stored bounds
            const { width, height } = newNode.bounds || estimateNodeDimensions(newNode);
            // Adjust existing nodes to make room for the new node
            const adjustedNodes = adjustNodesForNewNode(position, newNode.id, width, height, prevNodes);
            const finalNodes = [...adjustedNodes, newNode];
            // Validate and fix any remaining overlaps
            const validatedNodes = validateAndFixOverlaps(finalNodes);
            // Add creation animation
            setNewlyCreatedNodes((prev) => new Set([...prev, newNode.id]));
            // Remove animation after duration
            setTimeout(() => {
                setNewlyCreatedNodes((prev) => {
                    const updated = new Set(prev);
                    updated.delete(newNode.id);
                    return updated;
                });
            }, 300);
            // Fetch updated goal after adding new node
            if (sessionId) {
                getGoal(sessionId).then(goalResponse => {
                    setGoal(goalResponse);
                }).catch(() => {
                    // Goal update failed, continue without updated goal
                });
            }
            return validatedNodes;
        });
    }, []);
    const deleteNode = useCallback((id) => {
        const toDelete = new Set([id]);
        let changed = true;
        while (changed) {
            changed = false;
            nodes.forEach((node) => {
                if (node.parentId &&
                    toDelete.has(node.parentId) &&
                    !toDelete.has(node.id)) {
                    toDelete.add(node.id);
                    changed = true;
                }
            });
        }
        setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    }, [nodes]);
    const editNode = useCallback((id, content) => {
        setNodes((prev) => prev.map((n) => {
            if (n.id === id) {
                // Recalculate bounds when content changes (size might change)
                return calculateAndStoreBounds({ ...n, content });
            }
            return n;
        }));
        // Add update animation
        setUpdatedNodes((prev) => new Set([...prev, id]));
        // Remove animation after duration
        setTimeout(() => {
            setUpdatedNodes((prev) => {
                const updated = new Set(prev);
                updated.delete(id);
                return updated;
            });
        }, 400);
    }, []);
    const removeConnection = useCallback((childId) => {
        setNodes((prev) => prev.map((n) => (n.id === childId ? { ...n, parentId: null } : n)));
    }, []);
    const handleConceptExpansion = useCallback(async (conceptId, updatedConcept, newChildren, newEdges) => {
        setNodes((prevNodes) => {
            // Find the node with the matching conceptId
            const nodeToUpdate = prevNodes.find(n => n.conceptId === conceptId);
            if (!nodeToUpdate)
                return prevNodes;
            // Combine original summary with expansion text from the response
            const originalText = nodeToUpdate.content.text || "";
            const expansionText = updatedConcept.expansions && updatedConcept.expansions.length > 0
                ? updatedConcept.expansions[updatedConcept.expansions.length - 1] // Get the latest expansion
                : "";
            // Create combined text: original summary + expansion text
            const combinedText = expansionText
                ? `${updatedConcept.summary}\n\n${expansionText}`
                : updatedConcept.summary;
            // Update the existing node with new content and recalculate bounds
            const updatedNodes = prevNodes.map(n => n.conceptId === conceptId
                ? calculateAndStoreBounds({
                    ...n,
                    content: {
                        ...n.content,
                        text: combinedText,
                        header: updatedConcept.label
                    }
                })
                : n);
            // Add new child nodes if any
            const newNodeObjs = [];
            newChildren.forEach((child) => {
                const siblings = updatedNodes.filter(n => n.parentId === nodeToUpdate.id);
                // Use the same positioning logic as calculateNewNodePosition
                const position = calculateNewNodePosition(nodeToUpdate, siblings, updatedNodes, {
                    text: child.summary,
                    header: child.label
                });
                const newNode = calculateAndStoreBounds({
                    id: crypto.randomUUID(),
                    content: {
                        text: child.summary,
                        header: child.label
                    },
                    x: position.x,
                    y: position.y,
                    color: nodeToUpdate.color,
                    parentId: nodeToUpdate.id,
                    conceptId: child.id,
                });
                newNodeObjs.push(newNode);
            });
            const finalNodes = [...updatedNodes, ...newNodeObjs];
            // Add animation for new nodes
            newNodeObjs.forEach(newNode => {
                setNewlyCreatedNodes(prev => new Set([...prev, newNode.id]));
                setTimeout(() => {
                    setNewlyCreatedNodes(prev => {
                        const updated = new Set(prev);
                        updated.delete(newNode.id);
                        return updated;
                    });
                }, 500);
            });
            // Add update animation for the expanded node
            setUpdatedNodes(prev => new Set([...prev, nodeToUpdate.id]));
            setTimeout(() => {
                setUpdatedNodes(prev => {
                    const updated = new Set(prev);
                    updated.delete(nodeToUpdate.id);
                    return updated;
                });
            }, 400);
            return validateAndFixOverlaps(finalNodes);
        });
        // Fetch updated goal after expansion with a slight delay to allow backend processing
        if (sessionId) {
            setTimeout(async () => {
                try {
                    const goalResponse = await getGoal(sessionId);
                    setGoal(goalResponse);
                }
                catch (error) {
                    console.warn('Failed to fetch updated goal:', error);
                }
            }, 500);
        }
    }, [sessionId]);
    // Drag and drop
    const handleMouseDown = useCallback((e, nodeId) => {
        // Stop propagation to prevent panning
        e.stopPropagation();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node || !containerRef.current)
            return;
        // Calculate node position in screen coordinates (accounting for pan offset and zoom)
        const nodeX = node.x * zoomLevel + backgroundOffset.x;
        const nodeY = node.y * zoomLevel + backgroundOffset.y;
        setDraggingId(nodeId);
        setDragOffset({
            x: e.clientX - nodeX,
            y: e.clientY - nodeY,
        });
    }, [nodes, backgroundOffset, zoomLevel]);
    // Zoom functions
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
        if (newZoom !== zoomLevel) {
            // Calculate zoom center point (mouse position)
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const centerX = e.clientX - rect.left;
                const centerY = e.clientY - rect.top;
                // Adjust background offset to zoom towards mouse position
                const zoomRatio = newZoom / zoomLevel;
                const newOffsetX = centerX - (centerX - backgroundOffset.x) * zoomRatio;
                const newOffsetY = centerY - (centerY - backgroundOffset.y) * zoomRatio;
                setBackgroundOffset({ x: newOffsetX, y: newOffsetY });
            }
            setZoomLevel(newZoom);
        }
    }, [zoomLevel, backgroundOffset]);
    const zoomIn = useCallback(() => {
        const newZoom = Math.min(MAX_ZOOM, zoomLevel + 0.2);
        if (newZoom !== zoomLevel) {
            // Zoom towards center of viewport
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const zoomRatio = newZoom / zoomLevel;
                const newOffsetX = centerX - (centerX - backgroundOffset.x) * zoomRatio;
                const newOffsetY = centerY - (centerY - backgroundOffset.y) * zoomRatio;
                setBackgroundOffset({ x: newOffsetX, y: newOffsetY });
            }
            setZoomLevel(newZoom);
        }
    }, [zoomLevel, backgroundOffset]);
    const zoomOut = useCallback(() => {
        const newZoom = Math.max(MIN_ZOOM, zoomLevel - 0.2);
        if (newZoom !== zoomLevel) {
            // Zoom towards center of viewport
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const zoomRatio = newZoom / zoomLevel;
                const newOffsetX = centerX - (centerX - backgroundOffset.x) * zoomRatio;
                const newOffsetY = centerY - (centerY - backgroundOffset.y) * zoomRatio;
                setBackgroundOffset({ x: newOffsetX, y: newOffsetY });
            }
            setZoomLevel(newZoom);
        }
    }, [zoomLevel, backgroundOffset]);
    const resetZoom = useCallback(() => {
        setZoomLevel(1);
        setBackgroundOffset({ x: 0, y: 0 });
    }, []);
    // Add wheel event listener for zooming
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => {
                container.removeEventListener('wheel', handleWheel);
            };
        }
    }, [handleWheel]);
    // Add keyboard shortcuts for zoom
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '=':
                    case '+':
                        e.preventDefault();
                        zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        resetZoom();
                        break;
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [zoomIn, zoomOut, resetZoom]);
    // Optimized mouse move handler for smooth dragging
    const handleMouseMove = useCallback((e) => {
        if (draggingId) {
            // Node dragging - convert screen coordinates to canvas coordinates (accounting for zoom)
            const newX = (e.clientX - dragOffset.x - backgroundOffset.x) / zoomLevel;
            const newY = (e.clientY - dragOffset.y - backgroundOffset.y) / zoomLevel;
            // Update nodes immediately for smooth connection lines
            setNodes((prev) => {
                const draggingNode = prev.find((n) => n.id === draggingId);
                if (!draggingNode)
                    return prev;
                // Create updated dragging node with new position and recalculate bounds
                const updatedDraggingNode = calculateAndStoreBounds({ ...draggingNode, x: newX, y: newY });
                // Get the bounds of the dragged node
                const draggedBounds = updatedDraggingNode.bounds;
                // Push other nodes away from the dragged node to maintain minimum distance
                const adjustedNodes = pushNodesAwayFromDragged(draggedBounds, prev.filter(n => n.id !== draggingId), draggingId);
                // Return adjusted nodes with the updated dragging node
                return [...adjustedNodes, updatedDraggingNode];
            });
        }
        else if (isPanningBackground) {
            // Background panning
            const deltaX = e.clientX - panStartPos.x;
            const deltaY = e.clientY - panStartPos.y;
            setBackgroundOffset((prev) => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY,
            }));
            setPanStartPos({ x: e.clientX, y: e.clientY });
        }
    }, [draggingId, dragOffset, backgroundOffset, zoomLevel, isPanningBackground, panStartPos]);
    // Use document-level mouse events for proper panning/dragging
    useEffect(() => {
        const handleMouseUp = () => {
            setDraggingId(null);
            setIsPanningBackground(false);
        };
        if (draggingId || isPanningBackground) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [draggingId, isPanningBackground, handleMouseMove]);
    const handleBackgroundMouseDown = useCallback((e) => {
        // Start panning if clicking on background (not on a node or its children)
        const target = e.target;
        // Don't pan if clicking on a node or its children
        if (target.closest("[data-node-id]")) {
            return;
        }
        // Don't pan if clicking on interactive elements (buttons, inputs, etc.)
        if (target.tagName === "BUTTON" ||
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.closest("button") ||
            target.closest("input") ||
            target.closest("textarea")) {
            return;
        }
        // Start panning
        e.preventDefault();
        setIsPanningBackground(true);
        setPanStartPos({ x: e.clientX, y: e.clientY });
    }, []);
    // Calculate connections - update immediately when nodes change (no heavy memoization)
    // This ensures lines update instantly when nodes are pushed
    const connections = useMemo(() => {
        return nodes
            .map((node) => {
            const parent = nodes.find((n) => n.id === node.parentId);
            if (!parent)
                return null;
            // Use pixel coordinates directly from node positions
            const x1 = parent.x;
            const y1 = parent.y;
            const x2 = node.x;
            const y2 = node.y;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const colorData = NODE_COLORS.find((c) => node.color.includes(c.light.split(" ")[0].replace("border-", "")));
            const strokeColor = colorData?.darkConnection || CENTER_COLOR.darkConnection;
            return {
                id: node.id,
                path: `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`,
                strokeColor,
            };
        })
            .filter(Boolean);
    }, [nodes]); // Only depend on nodes - this ensures immediate updates
    // Weight tracking functions
    const incrementNodeWeight = useCallback((conceptId, increment = 1) => {
        setNodeWeights(prev => {
            const newWeights = new Map(prev);
            const currentWeight = newWeights.get(conceptId) || 0;
            const newWeight = currentWeight + increment;
            newWeights.set(conceptId, newWeight);
            // Update total weight
            const newTotal = Array.from(newWeights.values()).reduce((sum, weight) => sum + weight, 0);
            setTotalWeight(newTotal);
            // Log weight values
            console.log(`Node ${conceptId} weight: ${newWeight}, total weight: ${newTotal}`);
            // Check for completion (when total weight reaches more than 7)
            if (newTotal > 7) {
                console.log(`Completion achieved! Total weight reached ${newTotal}`);
                setShowCongratulations(true);
            }
            return newWeights;
        });
    }, []);
    const getNodeWeight = useCallback((conceptId) => {
        return nodeWeights.get(conceptId) || 0;
    }, [nodeWeights]);
    const checkCompletions = useCallback(() => {
        return totalWeight > 7;
    }, [totalWeight]);
    return {
        // State
        nodes,
        draggingId,
        containerRef,
        connections,
        backgroundOffset,
        isPanningBackground,
        newlyCreatedNodes,
        updatedNodes,
        sessionId,
        isLoading,
        zoomLevel,
        goal,
        showCongratulations,
        // Actions
        handleFinish,
        handleCloseCongratulations,
        addNode,
        deleteNode,
        editNode,
        removeConnection,
        handleConceptExpansion,
        zoomIn,
        zoomOut,
        resetZoom,
        handleMouseDown,
        handleBackgroundMouseDown,
        // Weight tracking
        incrementNodeWeight,
        getNodeWeight,
        checkCompletions,
        totalWeight,
    };
}
