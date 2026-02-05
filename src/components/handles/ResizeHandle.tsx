"use client";

// ═══════════════════════════════════════════════════════════════════════════
// RESIZE HANDLE — Drag to resize panels
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback, useRef, useState, type MouseEvent, type TouchEvent } from "react";

interface ResizeHandleProps {
    direction: "horizontal" | "vertical";
    onResize: (delta: number) => void;
    onResizeEnd?: () => void;
    minDistance?: number;
}

export function ResizeHandle({
    direction,
    onResize,
    onResizeEnd,
    minDistance = 2,
}: ResizeHandleProps) {
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef<number>(0);
    const lastDelta = useRef<number>(0);

    const getPosition = (e: MouseEvent | TouchEvent | globalThis.MouseEvent | globalThis.TouchEvent): number => {
        if ("touches" in e && e.touches.length > 0) {
            return direction === "horizontal" ? e.touches[0].clientX : e.touches[0].clientY;
        }
        if ("clientX" in e) {
            return direction === "horizontal" ? e.clientX : e.clientY;
        }
        return 0;
    };

    const handleStart = useCallback((e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
        startPos.current = getPosition(e);
        lastDelta.current = 0;

        const handleMove = (moveEvent: globalThis.MouseEvent | globalThis.TouchEvent) => {
            const currentPos = getPosition(moveEvent);
            const delta = currentPos - startPos.current;

            if (Math.abs(delta - lastDelta.current) >= minDistance) {
                onResize(delta - lastDelta.current);
                lastDelta.current = delta;
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
            onResizeEnd?.();
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchmove", handleMove);
        window.addEventListener("touchend", handleEnd);
    }, [direction, onResize, onResizeEnd, minDistance]);

    const isHorizontal = direction === "horizontal";

    return (
        <div
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            style={{
                position: "absolute",
                [isHorizontal ? "right" : "bottom"]: "-4px",
                [isHorizontal ? "top" : "left"]: 0,
                [isHorizontal ? "width" : "height"]: "8px",
                [isHorizontal ? "height" : "width"]: "100%",
                cursor: isHorizontal ? "col-resize" : "row-resize",
                background: isDragging ? "rgba(201,162,39,0.3)" : "transparent",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(201,162,39,0.15)";
            }}
            onMouseLeave={(e) => {
                if (!isDragging) {
                    (e.target as HTMLElement).style.background = "transparent";
                }
            }}
        >
            {/* Handle grip indicator */}
            <div
                style={{
                    width: isHorizontal ? "2px" : "24px",
                    height: isHorizontal ? "24px" : "2px",
                    background: isDragging ? "#c9a227" : "rgba(200,190,170,0.3)",
                    borderRadius: "1px",
                    transition: "background 0.15s",
                }}
            />
        </div>
    );
}
