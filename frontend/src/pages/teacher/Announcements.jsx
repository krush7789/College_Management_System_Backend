import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { announcements as announcementsApi, dashboard as dashboardApi } from '@/services/api';
import { Trash, Bell, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from "../../context/AuthContext";

const validationSchema = Yup.object({
    section_id: Yup.string().required('Target class is required'),
    title: Yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
    content: Yup.string().required('Content is required').min(10, 'Content must be at least 10 characters'),
});

const TeacherAnnouncements = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [sections, setSections] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [annRes, statsRes] = await Promise.all([
                announcementsApi.getAll(),
                dashboardApi.getTeacherStats()
            ]);

            setAnnouncements(annRes.data);

            // Extract unique sections from assigned courses
            const assignedCourses = statsRes.data.assigned_courses || [];
            const uniqueSections = Array.from(new Set(assignedCourses.map(c => JSON.stringify({ id: c.section_id, name: c.section }))))
                .map(s => JSON.parse(s));
            setSections(uniqueSections);

            if (uniqueSections.length > 0) {
                formik.setFieldValue('section_id', uniqueSections[0].id);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: "Error",
                description: "Failed to load announcement data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            title: "",
            content: "",
            section_id: "",
            target_role: "student"
        },
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            setLoading(true);
            try {
                await announcementsApi.create(values);
                toast({
                    title: "Success",
                    description: "Announcement posted for the section.",
                });
                resetForm();
                // Keep the section_id if possible, or reset it. 
                // Typically users might want to post another to the same section, but let's reset for now or re-set default.
                if (sections.length > 0) {
                    formik.setFieldValue('section_id', sections[0].id);
                }

                // Refresh list
                const res = await announcementsApi.getAll();
                setAnnouncements(res.data);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to post announcement.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        },
    });

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await announcementsApi.delete(id);
            toast({
                title: "Deleted",
                description: "Announcement removed.",
            });
            const res = await announcementsApi.getAll();
            setAnnouncements(res.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Announcements</h1>
                    <p className="text-sm text-slate-500">Post updates and notifications for your students.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Form */}
                <Card className="shadow-sm border-slate-200 lg:col-span-1 h-fit">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-indigo-500" />
                            New Announcement
                        </CardTitle>
                        <CardDescription>Send a message to a specific class.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={formik.handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Target Class</label>
                                <Select
                                    value={formik.values.section_id}
                                    onValueChange={(val) => formik.setFieldValue('section_id', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formik.touched.section_id && formik.errors.section_id && (
                                    <p className="text-xs text-red-500">{formik.errors.section_id}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
                                <Input
                                    placeholder="e.g. Exam Schedule Update"
                                    id="title"
                                    {...formik.getFieldProps('title')}
                                />
                                {formik.touched.title && formik.errors.title && (
                                    <p className="text-xs text-red-500">{formik.errors.title}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Content</label>
                                <Textarea
                                    placeholder="Type your message here..."
                                    className="min-h-[150px] resize-none"
                                    id="content"
                                    {...formik.getFieldProps('content')}
                                />
                                {formik.touched.content && formik.errors.content && (
                                    <p className="text-xs text-red-500">{formik.errors.content}</p>
                                )}
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                                {loading ? "Posting..." : "Post Announcement"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        <Bell className="h-4 w-4" />
                        Announcement History
                    </div>

                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                <p className="text-slate-500 text-sm">No announcements posted yet.</p>
                            </div>
                        ) : (
                            announcements
                                .map((ann) => (
                                    <Card key={ann.id} className="shadow-sm border-slate-200 group">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200">
                                                            {ann.section_id ? sections.find(s => s.id === ann.section_id)?.name || 'Class' : 'General'}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400">
                                                            {format(new Date(ann.created_at), 'MMM d, yyyy • h:mm a')}
                                                        </span>
                                                        {!ann.is_active && (
                                                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">Inactive</Badge>
                                                        )}
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                        {ann.title}
                                                    </h4>
                                                </div>
                                                {ann.created_by === user?.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(ann.id)}
                                                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 -mt-2 -mr-2"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                {ann.content}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                    {ann.creator_name ? ann.creator_name.charAt(0) : 'U'}
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {ann.created_by === user?.id ? 'Posted by You' : `Posted by ${ann.creator_name}`}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherAnnouncements;
