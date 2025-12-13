"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMindMap = useMindMap;
const react_1 = require("react");
const colors_1 = require("@/lib/colors");
const positioning_1 = require("@/lib/positioning");
const constants_1 = require("@/lib/constants");
function useMindMap(initialText) {
    // Theme state
    const [isDarkMode, setIsDarkMode] = (0, react_1.useState)(false);
    // Node state
    const [nodes, setNodes] = (0, react_1.useState)([
        Object.assign(Object.assign({}, constants_1.INITIAL_CENTER_NODE), { content: { text: initialText || "" }, color: colors_1.CENTER_COLOR.light }),
    ]);
    // Drag state
    const [draggingId, setDraggingId] = (0, react_1.useState)(null);
    const [dragOffset, setDragOffset] = (0, react_1.useState)({ x: 0, y: 0 });
    const [isPanningBackground, setIsPanningBackground] = (0, react_1.useState)(false);
    const [backgroundOffset, setBackgroundOffset] = (0, react_1.useState)({ x: 0, y: 0 });
    const [panStartPos, setPanStartPos] = (0, react_1.useState)({ x: 0, y: 0 });
    const containerRef = (0, react_1.useRef)(null);
    // Animation state
    const [newlyCreatedNodes, setNewlyCreatedNodes] = (0, react_1.useState)(new Set());
    const [updatedNodes, setUpdatedNodes] = (0, react_1.useState)(new Set());
    // Theme management
    (0, react_1.useEffect)(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDarkMode(savedTheme === "dark" || (!savedTheme && prefersDark));
    }, []);
    (0, react_1.useEffect)(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        }
        else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);
    const toggleTheme = (0, react_1.useCallback)(() => setIsDarkMode(!isDarkMode), [isDarkMode]);
    // Node management
    const addNode = (0, react_1.useCallback)((parentId, content) => {
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
                    .map((n) => colors_1.NODE_COLORS.findIndex((c) => n.color.includes(c.light.split(" ")[0].replace("border-", ""))))
                    .filter((i) => i !== -1));
                let colorIndex = 0;
                while (usedColorIndices.has(colorIndex) &&
                    colorIndex < colors_1.NODE_COLORS.length) {
                    colorIndex++;
                }
                if (colorIndex >= colors_1.NODE_COLORS.length) {
                    colorIndex = Math.floor(Math.random() * colors_1.NODE_COLORS.length);
                }
                nodeColor = colors_1.NODE_COLORS[colorIndex].light;
            }
            else {
                // This is a deeper level node - inherit parent's color
                nodeColor = parent.color;
            }
            const position = (0, positioning_1.calculateNewNodePosition)(parent, siblings, prevNodes);
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
    const deleteNode = (0, react_1.useCallback)((id) => {
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
    const editNode = (0, react_1.useCallback)((id, content) => {
        setNodes((prev) => prev.map((n) => (n.id === id ? Object.assign(Object.assign({}, n), { content }) : n)));
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
    const removeConnection = (0, react_1.useCallback)((childId) => {
        setNodes((prev) => prev.map((n) => (n.id === childId ? Object.assign(Object.assign({}, n), { parentId: null }) : n)));
    }, []);
    // Drag and drop
    const handleMouseDown = (0, react_1.useCallback)((e, nodeId) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node || !containerRef.current)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const nodeX = (node.x * rect.width) / 100;
        const nodeY = (node.y * rect.height) / 100;
        setDraggingId(nodeId);
        setDragOffset({
            x: e.clientX - nodeX,
            y: e.clientY - nodeY,
        });
    }, [nodes]);
    const handleMouseMove = (0, react_1.useCallback)((e) => {
        if (!containerRef.current)
            return;
        e.preventDefault();
        if (draggingId) {
            // Node dragging
            const rect = containerRef.current.getBoundingClientRect();
            const newX = ((e.clientX - dragOffset.x) / rect.width) * 100;
            const newY = ((e.clientY - dragOffset.y) / rect.height) * 100;
            const clampedX = Math.max(constants_1.LAYOUT_CONSTANTS.DRAG_BOUNDARY.MIN, Math.min(constants_1.LAYOUT_CONSTANTS.DRAG_BOUNDARY.MAX, newX));
            const clampedY = Math.max(constants_1.LAYOUT_CONSTANTS.DRAG_BOUNDARY.MIN, Math.min(constants_1.LAYOUT_CONSTANTS.DRAG_BOUNDARY.MAX, newY));
            setNodes((prev) => prev.map((n) => n.id === draggingId ? Object.assign(Object.assign({}, n), { x: clampedX, y: clampedY }) : n));
        }
        else if (isPanningBackground) {
            // Background panning
            const deltaX = e.clientX - panStartPos.x;
            const deltaY = e.clientY - panStartPos.y;
            setBackgroundOffset({
                x: backgroundOffset.x + deltaX,
                y: backgroundOffset.y + deltaY,
            });
            setPanStartPos({ x: e.clientX, y: e.clientY });
        }
    }, [draggingId, dragOffset, isPanningBackground, backgroundOffset, panStartPos]);
    const handleMouseUp = (0, react_1.useCallback)(() => {
        setDraggingId(null);
        setIsPanningBackground(false);
    }, []);
    const handleBackgroundMouseDown = (0, react_1.useCallback)((e) => {
        // Only start panning if clicking on background (not on a node)
        if (e.target === e.currentTarget) {
            setIsPanningBackground(true);
            setPanStartPos({ x: e.clientX, y: e.clientY });
        }
    }, []);
    // State for container dimensions
    const [containerDimensions, setContainerDimensions] = (0, react_1.useState)({
        width: 0,
        height: 0,
    });
    // Update container dimensions on resize
    (0, react_1.useEffect)(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerDimensions({ width: rect.width, height: rect.height });
            }
        };
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);
    // Memoized connections for performance
    const connections = (0, react_1.useMemo)(() => {
        if (containerDimensions.width === 0 || containerDimensions.height === 0)
            return [];
        return nodes
            .map((node) => {
            const parent = nodes.find((n) => n.id === node.parentId);
            if (!parent)
                return null;
            const x1 = (parent.x * containerDimensions.width) / 100;
            const y1 = (parent.y * containerDimensions.height) / 100;
            const x2 = (node.x * containerDimensions.width) / 100;
            const y2 = (node.y * containerDimensions.height) / 100;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const colorData = colors_1.NODE_COLORS.find((c) => node.color.includes(c.light.split(" ")[0].replace("border-", "")));
            const strokeColor = isDarkMode
                ? (colorData === null || colorData === void 0 ? void 0 : colorData.darkConnection) || colors_1.CENTER_COLOR.darkConnection
                : (colorData === null || colorData === void 0 ? void 0 : colorData.connection) || colors_1.CENTER_COLOR.connection;
            return {
                id: node.id,
                path: `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`,
                strokeColor,
            };
        })
            .filter(Boolean);
    }, [nodes, isDarkMode, containerDimensions]);
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
