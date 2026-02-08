import { useState, useEffect } from 'react';
import { dashboard } from '@/services/api'; import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const DefaultersWidget = () => {
    const [defaulters, setDefaulters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDefaulters = async () => {
            try {
                const res = await dashboard.getDefaulters(75);
                setDefaulters(res.data);
            } catch (err) {
                console.error("Failed to fetch defaulters:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDefaulters();
    }, []);

    if (loading) {
        return (
            <Card className="border-0 shadow-sm ring-1 ring-slate-100 h-full flex items-center justify-center p-6">
                <div className="h-6 w-6 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin"></div>
            </Card>
        );
    }

    return (
        <Card className="border border-slate-200 shadow-sm rounded-xl flex flex-col h-full bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 px-5 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Defaulters List
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-1">
                            Students with &lt; 75% attendance
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                        {defaulters.length} Found
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[340px] custom-scrollbar">
                {defaulters.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {defaulters.map((student) => (
                            <div key={student.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{student.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{student.roll_no}</p>
                                        <p className="text-[10px] text-slate-400">{student.class_info}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-bold ${student.attendance_pct < 50 ? 'text-red-600' : 'text-amber-600'}`}>
                                        {student.attendance_pct}%
                                    </span>
                                    <p className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {student.classes_attended} classes
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 h-full">
                        <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-600">No Defaulters</p>
                        <p className="text-xs text-slate-400">All students have good attendance</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DefaultersWidget;
