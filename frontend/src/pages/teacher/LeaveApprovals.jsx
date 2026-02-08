import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Clock, CalendarDays, Activity, Filter, FileText } from 'lucide-react';
import { leaves } from '@/services/api';
import { format } from 'date-fns';

const LeaveApprovals = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filter, setFilter] = useState('pending'); // 'pending', 'all'

    useEffect(() => {
        fetchLeaves();
    }, [filter]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const params = filter === 'pending' ? { status: 'pending' } : {};
            const res = await leaves.getAll(params);
            setLeaveRequests(res.data);
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast({
                title: "Error",
                description: "Failed to load leave applications.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            let payload = { status };

            // If rejecting, prompt for rejection reason (required by backend)
            if (status === 'rejected') {
                const reason = window.prompt("Please provide a reason for rejection:");
                if (!reason || reason.trim().length === 0) {
                    toast({
                        title: "Rejection Cancelled",
                        description: "A rejection reason is required.",
                        variant: "destructive",
                    });
                    return;
                }
                payload.rejection_reason = reason.trim();
            }

            await leaves.update(id, payload);
            toast({
                title: "Success",
                description: `Leave request ${status}.`,
            });
            fetchLeaves(); // Refresh list
        } catch (error) {
            console.error(`Error marking leave as ${status}:`, error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to update leave status.",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Pending
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Approvals</h1>
                    <p className="text-sm text-slate-500">Review and manage student leave applications.</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                    <Button
                        variant={filter === 'pending' ? 'white' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('pending')}
                        className={`text-xs font-medium ${filter === 'pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Pending Review
                    </Button>
                    <Button
                        variant={filter === 'all' ? 'white' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className={`text-xs font-medium ${filter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        All History
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        Applications
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[200px]">Student</TableHead>
                                <TableHead className="w-[200px]">Dates</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="w-[120px]">Status</TableHead>
                                <TableHead className="text-right w-[180px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <Activity className="h-4 w-4 animate-spin" />
                                            <span>Loading requests...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : leaveRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                        No leave requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaveRequests.map((leave) => {
                                    const startDate = new Date(leave.start_date);
                                    const endDate = new Date(leave.end_date);
                                    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

                                    return (
                                        <TableRow key={leave.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">
                                                        {leave.student ? `${leave.student.first_name} ${leave.student.last_name}` : 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {leave.student?.roll_no}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                                        <span>{leave.start_date}</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span>{leave.end_date}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 mt-1 pl-5">
                                                        {days} Day{days !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-slate-600 line-clamp-2" title={leave.reason}>
                                                    {leave.reason}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(leave.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {leave.status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleAction(leave.id, 'approved')}
                                                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAction(leave.id, 'rejected')}
                                                            className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">
                                                        Processed
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default LeaveApprovals;
