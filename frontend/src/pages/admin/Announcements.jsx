import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { announcements as announcementsApi } from '@/services/api';
import { Megaphone, Trash2, Send, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Announcements = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [sections, setSections] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        content: "",
        target_role: "all",
        section_id: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [annRes, secRes] = await Promise.all([
                announcementsApi.getAdminAll(),
                import('@/services/api').then(m => m.sections.getAll({ limit: 100 }))
            ]);
            setAnnouncements(annRes.data);
            setSections(secRes.data.items || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to load data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.content) return;

        setLoading(true);
        try {
            await announcementsApi.create(newAnnouncement);
            toast({
                title: "Success",
                description: "Announcement posted successfully.",
            });
            setNewAnnouncement({ title: "", content: "", target_role: "all", section_id: null });
            fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to post announcement.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await announcementsApi.delete(id);
            toast({
                title: "Deleted",
                description: "Announcement has been removed.",
            });
            fetchData();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete announcement.",
                variant: "destructive",
            });
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            all: "bg-slate-100 text-slate-600",
            student: "bg-blue-100 text-blue-600",
            teacher: "bg-indigo-100 text-indigo-600",
            admin: "bg-purple-100 text-purple-600"
        };
        return <Badge className={`${colors[role] || colors.all} border-0 capitalize`}>{role}</Badge>;
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Megaphone className="h-8 w-8 text-indigo-600" />
                        Announcements
                    </h1>
                    <p className="text-slate-500 font-medium">Broadcast messages to students, teachers, or staff.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="lg:col-span-1 border-0 shadow-xl rounded-[2rem] overflow-hidden self-start">
                    <CardHeader className="bg-slate-900 text-white p-6">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Post New
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Title</label>
                                <Input
                                    placeholder="Emergency Holiday, Event, etc."
                                    className="rounded-xl border-slate-100 h-12"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Target Role</label>
                                <Select
                                    value={newAnnouncement.target_role}
                                    onValueChange={(val) => setNewAnnouncement({ ...newAnnouncement, target_role: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-100 h-12">
                                        <SelectValue placeholder="Select target" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                        <SelectItem value="all">Everyone</SelectItem>
                                        <SelectItem value="student">Students</SelectItem>
                                        <SelectItem value="teacher">Teachers</SelectItem>
                                        <SelectItem value="admin">Administrators</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {newAnnouncement.target_role === 'student' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Target Section (Optional)</label>
                                    <Select
                                        value={newAnnouncement.section_id || "none"}
                                        onValueChange={(val) => setNewAnnouncement({ ...newAnnouncement, section_id: val === "none" ? null : val })}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-100 h-12">
                                            <SelectValue placeholder="All Sections" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                            <SelectItem value="none">All Sections</SelectItem>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Content</label>
                                <Textarea
                                    placeholder="Write your announcement details here..."
                                    className="rounded-xl border-slate-100 min-h-[150px] resize-none"
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                            >
                                {loading ? "Posting..." : "Broadcast Announcement"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Recent Broadcasts
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-100">
                                <Megaphone className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                <h4 className="text-slate-900 font-bold">No announcements yet</h4>
                                <p className="text-slate-400 text-sm">Start broadcasting to your academy.</p>
                            </div>
                        ) : (
                            announcements.map((ann) => (
                                <Card key={ann.id} className="border-0 shadow-sm rounded-[2rem] hover:shadow-md transition-shadow group overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                {getRoleBadge(ann.target_role)}
                                                {ann.section_id && (
                                                    <Badge className="bg-amber-100 text-amber-600 border-0 capitalize">
                                                        {sections.find(s => s.id === ann.section_id)?.name || 'Section'}
                                                    </Badge>
                                                )}
                                                <span className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(ann.created_at), 'MMM dd, yyyy')}
                                                </span>
                                                {!ann.is_active && (
                                                    <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500 uppercase tracking-wider">Inactive</Badge>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(ann.id)}
                                                className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 mb-2">{ann.title}</h4>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{ann.content}</p>
                                        <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                {ann.creator_name?.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">Posted by {ann.creator_name}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Announcements;
