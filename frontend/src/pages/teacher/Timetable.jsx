import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, BookOpen } from 'lucide-react';
import { dashboard } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import SectionHeader from '@/components/SectionHeader';

const TeacherTimetable = () => {
    const { toast } = useToast();
    const [schedule, setSchedule] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const [timetableRes, statsRes] = await Promise.all([
                dashboard.getTeacherTimetable(),
                dashboard.getTeacherStats()
            ]);

            const data = timetableRes.data;
            setAssignments(statsRes.data.assigned_courses || []);

            // Group by period and day
            const grouped = data.reduce((acc, curr) => {
                const period = curr.period;
                const day = curr.day;
                if (!acc[period]) acc[period] = {};
                acc[period][day] = curr;
                return acc;
            }, {});

            // Sort periods and format
            const sortedPeriods = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
            const timetableGrid = sortedPeriods.map(p => ({
                period: p,
                days: grouped[p]
            }));

            setSchedule(timetableGrid);
        } catch (error) {
            console.error("Error fetching timetable:", error);
            toast({
                title: "Error",
                description: "Failed to load timetable.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Weekly Schedule"
                subtitle="View your class timings and locations"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Assigned Subjects Card */}
                <Card className="md:col-span-1 shadow-sm border-slate-200 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            Assigned Subjects
                        </CardTitle>
                        <CardDescription>
                            Your subjects for this semester
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assignments.length > 0 ? (
                            <div className="space-y-3">
                                {assignments.map((assignment, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="font-medium text-slate-900">{assignment.subject}</div>
                                        <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                            <Users className="h-3 w-3" />
                                            {assignment.section}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <p>No subjects assigned yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Timetable Grid */}
                <Card className="md:col-span-2 shadow-sm border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                                        Period
                                    </th>
                                    {weekdays.map(day => (
                                        <th key={day} className="p-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[18%]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedule.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400">
                                            No classes scheduled for this week.
                                        </td>
                                    </tr>
                                ) : (
                                    schedule.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50">
                                            <td className="p-4 border-r border-slate-100 bg-white group-hover:bg-slate-50/50 sticky left-0 z-10">
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <span className="text-lg font-bold text-slate-900">P{row.period}</span>
                                                    {row.days && Object.values(row.days)[0] && (
                                                        <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                                            <Clock className="h-3 w-3" />
                                                            {Object.values(row.days)[0].start_time}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {weekdays.map(day => {
                                                const entry = row.days[day];
                                                return (
                                                    <td key={day} className="p-2 align-top h-32">
                                                        {entry ? (
                                                            <div className="h-full p-3 rounded-lg bg-indigo-50 border border-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-indigo-900 text-sm line-clamp-2">
                                                                        {entry.subject}
                                                                    </h4>
                                                                </div>
                                                                <div className="space-y-1 mt-2">
                                                                    <Badge variant="outline" className="bg-white/50 text-indigo-700 border-indigo-200 text-[10px] px-1.5 py-0 h-5">
                                                                        {entry.section_name}
                                                                    </Badge>
                                                                    <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                                                                        <MapPin className="h-3 w-3" />
                                                                        Room {entry.room}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-full bg-slate-50/50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center opacity-40">
                                                                {/* Empty slot */}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TeacherTimetable;
