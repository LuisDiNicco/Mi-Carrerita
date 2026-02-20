import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { ReactFlowInstance, Node } from "@xyflow/react";
import type { Subject } from "../../../shared/types/academic";
import { GRAPH_LAYOUT } from "../lib/graph-layout";
import { SEARCH_MIN_CHARS, SEARCH_ZOOM, FOCUS_TIMEOUT_MS } from "../lib/graph-constants";
import { SEARCH_RESULTS_LIMIT } from "../../../shared/lib/graph";

export const useGraphSearch = (
    subjects: Subject[],
    nodes: Node[],
    flowInstance: ReactFlowInstance | null,
    setFocusedId: (id: string | null) => void,
) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
            }
        };
    }, []);

    const searchResults = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (query.length < SEARCH_MIN_CHARS) return [];
        return subjects
            .filter(
                (subject) =>
                    subject.name.toLowerCase().includes(query) ||
                    subject.planCode.toLowerCase().includes(query),
            )
            .slice(0, SEARCH_RESULTS_LIMIT);
    }, [searchQuery, subjects]);

    const handleSelectSubject = useCallback(
        (subject: Subject) => {
            const node = nodes.find((item) => item.id === subject.id);
            if (!node) return;
            const centerX = node.position.x + GRAPH_LAYOUT.nodeWidth / 2;
            const centerY = node.position.y + GRAPH_LAYOUT.nodeHeight / 2;
            if (flowInstance) {
                flowInstance.setCenter(centerX, centerY, {
                    zoom: SEARCH_ZOOM,
                    duration: 300,
                });
            }
            setFocusedId(subject.id);
            setSearchQuery("");
            setSearchOpen(false);
            if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
            }
            focusTimeoutRef.current = setTimeout(
                () => setFocusedId(null),
                FOCUS_TIMEOUT_MS,
            );
        },
        [flowInstance, nodes, setFocusedId],
    );

    return {
        searchQuery,
        setSearchQuery,
        searchOpen,
        setSearchOpen,
        searchResults,
        handleSelectSubject,
    };
};
