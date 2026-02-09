import * as React from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { sections } from "@/services/api";
import { Badge } from "@/components/ui/badge";

export function SectionSelect({
    value,
    onChange,
    branchId,
    semesterId,
    disabled,
    placeholder = "Select section...",
    className
}) {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    // Fetch all sections
    const { data: sectionsList = [], isLoading } = useQuery({
        queryKey: ['sections-all-select'],
        queryFn: async () => {
            const res = await sections.getAll({ limit: 1000 }); // Fetch enough to cover most cases
            return res.data.items || [];
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    // Filter logic
    const filteredSections = React.useMemo(() => {
        return sectionsList.filter((section) => {
            // 1. Filter by props (branch/semester) if provided
            if (branchId && String(section.branch_id) !== String(branchId)) return false;
            // Note: If semesterId is provided, strict filter. If not provided (undefined/null), allow ALL semesters (crucial for promotion).
            if (semesterId && String(section.semester_id) !== String(semesterId)) return false;

            // 2. Filter by search term
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const sectionName = section.section_name?.toLowerCase() || "";
            const branchCode = section.branch_code?.toLowerCase() || "";
            const semName = section.semester_name ? `sem ${section.semester_name}` : "";

            return (
                sectionName.includes(term) ||
                branchCode.includes(term) ||
                semName.includes(term)
            );
        });
    }, [sectionsList, branchId, semesterId, searchTerm]);

    const selectedSection = sectionsList.find((s) => String(s.id) === String(value));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-12 rounded-2xl border-gray-200 bg-gray-50/50 hover:bg-white transition-all font-medium text-base", className)}
                    disabled={disabled || isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                        </span>
                    ) : selectedSection ? (
                        <div className="flex items-center gap-2 truncate">
                            <span>Section {selectedSection.section_name}</span>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-500 font-bold border-0">
                                {selectedSection.branch_code} • Sem {selectedSection.semester_name}
                            </Badge>
                        </div>
                    ) : (
                        <span className="text-gray-500 font-normal">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border-gray-100" align="start">
                <div className="flex items-center border-b border-gray-50 px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        placeholder="Search sections..."
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 px-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredSections.length === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-500">No section found.</div>
                    ) : (
                        filteredSections.map((section) => (
                            <div
                                key={section.id}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none hover:bg-gray-50 transition-colors",
                                    String(value) === String(section.id) && "bg-blue-50 text-blue-700"
                                )}
                                onClick={() => {
                                    onChange(String(section.id));
                                    setOpen(false);
                                    setSearchTerm("");
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        String(value) === String(section.id) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span className="font-semibold">Section {section.section_name}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                        {section.branch_code} • Semester {section.semester_name}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
