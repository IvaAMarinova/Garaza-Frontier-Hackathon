"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { NODE_COLORS, CENTER_COLOR } from "../lib/colors";
import { calculateNewNodePosition } from "../lib/positioning";
import { INITIAL_CENTER_NODE } from "../lib/constants";
export function useMindMap(initialText) {
    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(false);
    // Node state - initialize center node at viewport center
    const [nodes, setNodes] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    // Initialize center node position when container is ready
    useEffect(() => {
        if (containerRef.current && !isInitialized) {
            const rect = containerRef.current.getBoundingClientRect();
            setNodes([
                {
                    ...INITIAL_CENTER_NODE,
                    x: rect.width / 2,
                    y: rect.height / 2,
                    content: { text: initialText || "" },
                    color: CENTER_COLOR.light,
                },
            ]);
            setIsInitialized(true);
        }
    }, [initialText, isInitialized]);
    // Drag state
    const [draggingId, setDraggingId] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isPanningBackground, setIsPanningBackground] = useState(false);
    const [backgroundOffset, setBackgroundOffset] = useState({ x: 0, y: 0 });
    const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    // Animation state
    const [newlyCreatedNodes, setNewlyCreatedNodes] = useState(new Set());
    const [updatedNodes, setUpdatedNodes] = useState(new Set());
    // Theme management
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
    }, []);
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        }
        else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);
    const toggleTheme = useCallback(() => setIsDarkMode(!isDarkMode), [isDarkMode]);
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
                nodeColor = NODE_COLORS[colorIndex].light;
            }
            else {
                // This is a deeper level node - inherit parent's color
                nodeColor = parent.color;
            }
            const position = calculateNewNodePosition(parent, siblings, prevNodes);
            const newNode = {
                id: crypto.randomUUID(),
                content,
                x: position.x,
                y: position.y,
                color: nodeColor,
                parentId,
            };
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
            return [...prevNodes, newNode];
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
        setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)));
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
    // Drag and drop
    const handleMouseDown = useCallback((e, nodeId) => {
        // Stop propagation to prevent panning
        e.stopPropagation();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node || !containerRef.current)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate node position in screen coordinates (accounting for pan offset)
        const nodeX = node.x + backgroundOffset.x;
        const nodeY = node.y + backgroundOffset.y;
        setDraggingId(nodeId);
        setDragOffset({
            x: e.clientX - nodeX,
            y: e.clientY - nodeY,
        });
    }, [nodes, backgroundOffset]);
    // Use document-level mouse events for proper panning/dragging
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (draggingId) {
                // Node dragging - convert screen coordinates to canvas coordinates
                const newX = e.clientX - dragOffset.x - backgroundOffset.x;
                const newY = e.clientY - dragOffset.y - backgroundOffset.y;
                // Check for overlaps before updating position
                const MIN_DISTANCE = Math.sqrt(180 * 180 + 120 * 120) + 20; // Same as positioning.ts
                setNodes((prev) => {
                    const draggingNode = prev.find((n) => n.id === draggingId);
                    if (!draggingNode)
                        return prev;
                    // Check for overlaps with current nodes
                    const hasOverlap = prev.some((node) => {
                        if (node.id === draggingId)
                            return false;
                        const distance = Math.sqrt(Math.pow(node.x - newX, 2) + Math.pow(node.y - newY, 2));
                        return distance < MIN_DISTANCE;
                    });
                    // Only update if no overlap
                    if (!hasOverlap) {
                        return prev.map((n) => n.id === draggingId ? { ...n, x: newX, y: newY } : n);
                    }
                    return prev;
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
        };
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
    }, [draggingId, dragOffset, isPanningBackground, backgroundOffset, panStartPos]);
    const handleMouseMove = useCallback((e) => {
        // This is kept for compatibility but document events handle the actual work
        e.preventDefault();
    }, []);
    const handleMouseUp = useCallback(() => {
        setDraggingId(null);
        setIsPanningBackground(false);
    }, []);
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
    // Memoized connections for performance
    const connections = useMemo(() => {
        return nodes
            .map((node) => {
            const parent = nodes.find((n) => n.id === node.parentId);
            if (!parent)
                return null;
            // Use pixel coordinates directly
            const x1 = parent.x;
            const y1 = parent.y;
            const x2 = node.x;
            const y2 = node.y;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const colorData = NODE_COLORS.find((c) => node.color.includes(c.light.split(" ")[0].replace("border-", "")));
            const strokeColor = isDarkMode
                ? colorData?.darkConnection || CENTER_COLOR.darkConnection
                : colorData?.connection || CENTER_COLOR.connection;
            return {
                id: node.id,
                path: `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`,
                strokeColor,
            };
        })
            .filter(Boolean);
    }, [nodes, isDarkMode]);
    return {
        // State
        isDarkMode,
        nodes,
        draggingId,
        containerRef,
        connections,
        backgroundOffset,
        isPanningBackground,
        newlyCreatedNodes,
        updatedNodes,
        // Actions
        toggleTheme,
        addNode,
        deleteNode,
        editNode,
        removeConnection,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleBackgroundMouseDown,
    };
}
