import { cn } from "@/lib/utils";

/**
 * SectionHeader - Consistent page header component
 * Used across all portal pages for uniformity
 * 
 * @param {string} title - Page title
 * @param {string} subtitle - Optional subtitle/description
 * @param {React.ReactNode} actions - Optional action buttons on the right
 * @param {string} className - Additional classes
 */
const SectionHeader = ({
    title,
    subtitle,
    actions,
    className
}) => {
    return (
        <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between gap-4",
            className
        )}>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-[var(--muted-foreground)] mt-1 text-sm">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default SectionHeader;
