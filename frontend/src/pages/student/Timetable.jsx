import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, MapPin, User, Calendar } from 'lucide-react';
import { dashboard } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import SectionHeader from '@/components/SectionHeader';

const StudentTimetable = () => {
    const { toast } = useToast();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const res = await dashboard.getStudentTimetable();
            const data = res.data;

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
        return <div className="p-8 text-center text-slate-500">Loading timetable...</div>;
    }

    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Class Timetable"
                subtitle="Your weekly schedule of lectures and labs"
            />

            <Card className="shadow-sm border-slate-200 overflow-hidden">
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
                                                        <div className="h-full p-3 rounded-lg bg-indigo-50 border border-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col justify-between group/card">
                                                            <div>
                                                                <h4 className="font-semibold text-indigo-900 text-sm line-clamp-2">
                                                                    {entry.subject}
                                                                </h4>
                                                                <p className="text-[10px] text-indigo-600/80 mt-1 font-medium flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {entry.teacher_name || "Faculty Assigned"}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2">
                                                                <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                                                                    <MapPin className="h-3 w-3" />
                                                                    Room {entry.room}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full bg-slate-50/50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center opacity-40">
                                                            <span className="text-[10px] font-medium text-slate-400">Free</span>
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
    );
};

export default StudentTimetable;
