import { useState } from 'react';
import type { Subject } from '../../../shared/types/academic';

export const useGraphUI = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCriticalPath, setShowCriticalPath] = useState(false);
    const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const containerClass = isFullscreen
        ? "fixed inset-0 z-40 bg-app p-6 w-full h-full"
        : "w-full h-[70vh] bg-app rounded-xl overflow-hidden";

    return {
        isFullscreen,
        setIsFullscreen,
        showCriticalPath,
        setShowCriticalPath,
        activeSubject,
        setActiveSubject,
        isPanelOpen,
        setIsPanelOpen,
        containerClass,
    };
};
