import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { announcements } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import {
    Megaphone,
    Calendar,
    User,
    Bell,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const StudentAnnouncements = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [announcementsList, setAnnouncementsList] = useState([]);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const res = await announcements.getForStudent();
            setAnnouncementsList(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            // Fallback empty state or error toast
            toast({
                title: "Error",
                description: "Failed to load latest announcements.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'urgent':
                return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Urgent</Badge>;
            case 'medium':
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Important</Badge>;
            default:
                return null; // Don't show badge for low priority or normal
        }
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'academic': return <CheckCircle2 className="h-5 w-5 text-indigo-500" />;
            case 'event': return <Calendar className="h-5 w-5 text-emerald-500" />;
            case 'alert': return <AlertCircle className="h-5 w-5 text-rose-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-64" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
                <p className="text-sm text-slate-500">Stay updated with the latest news and notices.</p>
            </div>

            <div className="grid gap-4">
                {announcementsList.length === 0 ? (
                    <Card className="border-dashed border-2 border-slate-200 shadow-none bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                            <Bell className="h-10 w-10 text-slate-300 mb-4" />
                            <p className="font-medium">No new announcements</p>
                            <p className="text-sm mt-1">You're all caught up!</p>
                        </CardContent>
                    </Card>
                ) : (
                    announcementsList.map((item) => (
                        <Card key={item.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow group">
                            <CardHeader className="flex flex-row items-start gap-4 pb-2">
                                <div className={`p-3 rounded-full bg-slate-50 border border-slate-100 mt-1`}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {item.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            {getPriorityBadge(item.priority)}
                                            {!item.is_active && (
                                                <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500 uppercase">Inactive</Badge>
                                            )}
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(item.created_at || item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <CardDescription className="flex items-center gap-2 text-xs">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {item.author || "Faculty"}
                                        </span>
                                        <span>•</span>
                                        <span className="uppercase tracking-wider font-semibold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                            {item.type || "General"}
                                        </span>
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pl-[4.5rem] pt-0">
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {item.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentAnnouncements;
