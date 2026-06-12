import { useEffect } from "react";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

declare global {
    interface Window {
        Calendly: any;
    }
}

export const CalendlyPopup = () => {
    useEffect(() => {
        // Add Calendly CSS
        const link = document.createElement("link");
        link.href = "https://assets.calendly.com/assets/external/widget.css";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        // Add Calendly JS script
        const script = document.createElement("script");
        script.src = "https://assets.calendly.com/assets/external/widget.js";
        script.type = "text/javascript";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup to prevent duplicate tags if component remounts
            if (document.head.contains(link)) {
                document.head.removeChild(link);
            }
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (window.Calendly) {
            window.Calendly.initPopupWidget({ url: 'https://calendly.com/yatricloud/40min' });
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-40 group flex flex-col items-start">
            {/* Tooltip Popup */}
            <div className="absolute bottom-full left-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-max">
                    <div className="text-sm font-bold text-primary mb-0.5">
                        Schedule a Meeting 🕒
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Book time to start your exam process</p>
                </div>
                {/* Arrow bottom */}
                <div className="absolute top-full left-6 -mt-1">
                    <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white dark:border-t-gray-800" />
                </div>
            </div>

            {/* Floating Button */}
            <motion.button
                onClick={handleClick}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-6 py-4 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Calendar size={22} className="relative z-10" />
                <span className="font-bold text-sm relative z-10 tracking-wide">Schedule Meet</span>
            </motion.button>
        </div>
    );
};
