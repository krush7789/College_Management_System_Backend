import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * StatCard - Modern analytics-style stat card with soft pastel icon background
 * Matches the reference dashboard design
 * 
 * @param {string} label - The stat label (e.g., "Total Students")
 * @param {number|string} value - The stat value (e.g., 37239)
 * @param {React.Component} icon - Lucide icon component
 * @param {string} iconColor - One of: purple, blue, lavender, amber, mint, rose
 * @param {string} trend - Optional trend text (e.g., "+12% from last month")
 * @param {boolean} trendUp - Whether the trend is positive
 * @param {string} className - Additional classes
 */
const StatCard = ({
    label,
    value,
    icon: Icon,
    iconColor = "purple",
    trend,
    trendUp = true,
    className
}) => {
    const colorMap = {
        purple: { bg: "bg-[var(--stat-purple)]", icon: "text-[var(--stat-purple-icon)]" },
        blue: { bg: "bg-[var(--stat-blue)]", icon: "text-[var(--stat-blue-icon)]" },
        lavender: { bg: "bg-[var(--stat-lavender)]", icon: "text-[var(--stat-lavender-icon)]" },
        amber: { bg: "bg-[var(--stat-amber)]", icon: "text-[var(--stat-amber-icon)]" },
        mint: { bg: "bg-[var(--stat-mint)]", icon: "text-[var(--stat-mint-icon)]" },
        rose: { bg: "bg-[var(--stat-rose)]", icon: "text-[var(--stat-rose-icon)]" },
    };

    const colors = colorMap[iconColor] || colorMap.purple;

    return (
        <Card className={cn(
            "border border-[var(--card-border)] shadow-[var(--shadow-sm)] rounded-xl hover:shadow-[var(--shadow-md)] transition-shadow duration-200",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                            {label}
                        </p>
                        <h3 className="text-3xl font-bold text-[var(--foreground)] mt-2 tracking-tight">
                            {value}
                        </h3>
                        {trend && (
                            <p className={cn(
                                "text-xs font-medium mt-2 flex items-center gap-1",
                                trendUp ? "text-emerald-600" : "text-red-600"
                            )}>
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={cn(
                        "p-3 rounded-lg flex-shrink-0",
                        colors.bg
                    )}>
                        <Icon className={cn("h-5 w-5", colors.icon)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatCard;
