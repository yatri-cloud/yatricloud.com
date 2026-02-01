import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color: string;
}

export const StatsCard = ({ title, value, icon: Icon, color }: StatsCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
};
