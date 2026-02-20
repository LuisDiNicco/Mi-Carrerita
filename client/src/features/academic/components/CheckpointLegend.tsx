import { Trophy, Award, Zap, Star } from 'lucide-react';

export const CheckpointLegend = () => {
    const items = [
        { label: 'Inicio', icon: Zap, color: 'text-gray-400' },
        { label: 'Título Intermedio', icon: Award, color: 'text-blue-400' },
        { label: 'Proyecto Final', icon: Star, color: 'text-yellow-400' },
        { label: 'Ingeniero', icon: Trophy, color: 'text-unlam-500' },
    ];

    return (
        <div className="absolute top-4 right-4 bg-app-surface/90 backdrop-blur border border-app-border rounded-lg p-3 shadow-lg z-10 hidden md:block">
            <h4 className="text-xs uppercase tracking-widest text-muted mb-2 font-bold border-b border-app-border pb-1">
                Hitos
            </h4>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                        <item.icon size={12} className={item.color} />
                        <span className="text-app-text/80">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
