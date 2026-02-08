import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dashboard, leaves } from '@/services/api';
import { useToast } from "@/components/ui/use-toast";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const validationSchema = Yup.object({
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date()
        .required('End date is required')
        .min(Yup.ref('startDate'), 'End date must be after start date'),
    reason: Yup.string()
        .required('Reason is required')
        .min(10, 'Reason must be at least 10 characters'),
});

const StudentLeaveApplication = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchLeaveData();
    }, []);

    const fetchLeaveData = async () => {
        try {
            setLoading(true);

            // Fetch leave applications
            const leavesRes = await leaves.getAll();
            setLeaveHistory(leavesRes.data || []);

            // Calculate stats from the leave data
            const allLeaves = leavesRes.data || [];
            const pending = allLeaves.filter(l => l.status === 'pending').length;
            const approved = allLeaves.filter(l => l.status === 'approved').length;
            const rejected = allLeaves.filter(l => l.status === 'rejected').length;

            setStats({
                pending_leaves_count: pending,
                approved_leaves_count: approved,
                rejected_leaves_count: rejected
            });

        } catch (error) {
            console.error("Error fetching leave data:", error);
            setLeaveHistory([]);
            setStats({
                pending_leaves_count: 0,
                approved_leaves_count: 0,
                rejected_leaves_count: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            startDate: '',
            endDate: '',
            reason: '',
            // documents: null // File handling typically needs simpler handling or separate upload for now
        },
        validationSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                setLoading(true);

                // Transform camelCase to snake_case for backend
                const payload = {
                    start_date: values.startDate,
                    end_date: values.endDate,
                    reason: values.reason
                };

                await leaves.create(payload);

                toast({
                    title: "Application Submitted",
                    description: "Your leave request has been sent for approval.",
                });
                resetForm();
                fetchLeaveData();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to submit leave application.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        },
    });

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200">Rejected</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Application</h1>
                    <p className="text-sm text-slate-500">Apply for leaves and track status.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Application Form */}
                <div className="lg:col-span-1">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900">New Request</CardTitle>
                            <CardDescription>Submit a new leave application</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={formik.handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">From</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formik.values.startDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {formik.values.startDate ? (
                                                            format(new Date(formik.values.startDate), 'PPP')
                                                        ) : (
                                                            'Pick a date'
                                                        )}
                                                    </span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formik.values.startDate ? new Date(formik.values.startDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            // Format to YYYY-MM-DD for backend
                                                            const formatted = format(date, 'yyyy-MM-dd');
                                                            formik.setFieldValue('startDate', formatted);
                                                        }
                                                    }}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {formik.touched.startDate && formik.errors.startDate && (
                                            <p className="text-xs text-red-500">{formik.errors.startDate}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">To</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formik.values.endDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {formik.values.endDate ? (
                                                            format(new Date(formik.values.endDate), 'PPP')
                                                        ) : (
                                                            'Pick a date'
                                                        )}
                                                    </span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={formik.values.endDate ? new Date(formik.values.endDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            // Format to YYYY-MM-DD for backend
                                                            const formatted = format(date, 'yyyy-MM-dd');
                                                            formik.setFieldValue('endDate', formatted);
                                                        }
                                                    }}
                                                    disabled={(date) => {
                                                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                                                        const startDate = formik.values.startDate ? new Date(formik.values.startDate) : today;
                                                        return date < today || date < startDate;
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {formik.touched.endDate && formik.errors.endDate && (
                                            <p className="text-xs text-red-500">{formik.errors.endDate}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Please provide a valid reason..."
                                        className="resize-none min-h-[100px]"
                                        {...formik.getFieldProps('reason')}
                                    />
                                    {formik.touched.reason && formik.errors.reason && (
                                        <p className="text-xs text-red-500">{formik.errors.reason}</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                                    {loading ? "Submitting..." : "Submit Application"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* History & Status */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="shadow-sm border-slate-200 p-4 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-full">
                                <Clock className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pending</p>
                                <h4 className="text-2xl font-bold text-slate-900">{stats?.pending_leaves_count || 0}</h4>
                            </div>
                        </Card>
                        <Card className="shadow-sm border-slate-200 p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-full">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Approved</p>
                                <h4 className="text-2xl font-bold text-slate-900">{stats?.approved_leaves_count || 0}</h4>
                            </div>
                        </Card>
                        <Card className="shadow-sm border-slate-200 p-4 flex items-center gap-4">
                            <div className="p-3 bg-rose-50 rounded-full">
                                <XCircle className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Rejected</p>
                                <h4 className="text-2xl font-bold text-slate-900">{stats?.rejected_leaves_count || 0}</h4>
                            </div>
                        </Card>
                    </div>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-base font-semibold text-slate-900">Application History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dates</TableHead>
                                        <TableHead className="w-[40%]">Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaveHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                                                No leave applications found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        leaveHistory.map((leave, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50/50">
                                                <TableCell className="text-slate-600 text-sm">
                                                    {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell className="text-slate-600 text-sm truncate max-w-[200px]" title={leave.reason}>
                                                    {leave.reason}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(leave.status)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default StudentLeaveApplication;
