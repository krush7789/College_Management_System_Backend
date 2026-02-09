import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { announcements as announcementsApi } from '@/services/api';
import { Megaphone, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const AnnouncementWidget = ({ limit = 3 }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await announcementsApi.getAll();
                setAnnouncements(res.data.slice(0, limit));
            } catch (error) {
                console.error("Error fetching announcements:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, [limit]);

    if (loading) {
        return (
            <Card className="border-0 shadow-sm rounded-[2rem]">
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </CardContent>
            </Card>
        );
    }

    if (announcements.length === 0) return null;

    return (
        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 px-5 pt-4">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-slate-500" />
                    Latest Announcements
                </CardTitle>
                <Link to="/student/announcements" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                    View All <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
                {announcements.map((ann, idx) => (
                    <div key={ann.id} className={`group relative p-4 hover:bg-slate-50 transition-all duration-200 ${idx !== announcements.length - 1 ? 'border-b border-slate-100' : ''}`}>
                        <div className="flex justify-between items-start mb-1.5">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(ann.created_at), 'MMM dd, yyyy')}
                            </span>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wide font-semibold border-0 flex gap-2">
                                {ann.section_id ? 'SECTION' : (ann.target_role === 'all' ? 'GLOBAL' : ann.target_role)}
                                {!ann.is_active && <span className="text-slate-400 border-l border-slate-300 pl-2">Inactive</span>}
                            </Badge>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-1 leading-tight group-hover:text-blue-700 transition-colors">{ann.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                        {ann.creator_name && (
                            <div className="mt-2 text-[10px] text-slate-400 font-medium">
                                By {ann.creator_name}
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default AnnouncementWidget;
