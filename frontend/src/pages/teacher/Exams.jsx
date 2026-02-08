import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exams, dashboard } from '../../services/api';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Search, BookOpen, AlertCircle, Calendar, Pencil, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const initialFormData = {
    exam_name: '',
    section_id: '',
    subject_id: '',
    exam_date: '',
    total_marks: 100,
    description: ''
};

const TeacherExams = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState(null);

    // Data Fetching
    const { data: examsData = { items: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['teacher-exams', page, searchTerm],
        queryFn: async () => {
            const res = await exams.getAll({
                skip: (page - 1) * limit,
                limit,
                search: searchTerm
            });
            return res.data;
        }
    });
    const examsList = examsData.items || [];
    const totalCount = examsData.total || 0;

    // Fetch Teacher's Assigned Courses (Sections & Subjects)
    const { data: teacherStats } = useQuery({
        queryKey: ['teacher-stats'],
        queryFn: async () => {
            const res = await dashboard.getTeacherStats();
            return res.data;
        }
    });
    const assignedCourses = teacherStats?.assigned_courses || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => exams.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['teacher-exams']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to create exam.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => exams.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['teacher-exams']);
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData(initialFormData);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to update exam.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => exams.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['teacher-exams']),
        onError: (err) => alert(err.response?.data?.detail || 'Failed to delete exam.')
    });

    // Handlers
    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                exam_name: item.exam_name,
                section_id: item.section_id,
                subject_id: item.subject_id,
                exam_date: item.exam_date,
                total_marks: item.total_marks,
                description: item.description || ''
            });
        } else {
            setEditingItem(null);
            setFormData(initialFormData);
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.section_id || !formData.subject_id) {
            setError('Please select both Section and Subject.');
            return;
        }
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Exams</h1>
                    <p className="text-sm text-slate-500">Manage and schedule assessments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Exam
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Exam Schedule</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search exams..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="pl-8 h-9 w-[200px] lg:w-[300px]"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[250px] pl-6">Exam Name</TableHead>
                                <TableHead>Section & Subject</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Total Marks</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="h-16 px-6 text-center">
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : examsList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No exams found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                examsList.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                                        <TableCell className="pl-6 font-medium text-slate-900">
                                            {item.exam_name}
                                            {item.description && (
                                                <p className="text-xs text-slate-500 font-normal truncate max-w-[200px]">{item.description}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-slate-700">{item.section?.name}</span>
                                                <Badge variant="secondary" className="w-fit text-[10px] font-normal">
                                                    {item.subject?.name}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {format(new Date(item.exam_date), 'MMM d, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-mono">
                                                {item.total_marks} pts
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenModal(item)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-rose-600 focus:text-rose-600"
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this exam?')) {
                                                                deleteMutation.mutate(item.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Exam' : 'Schedule New Exam'}</DialogTitle>
                        <DialogDescription>
                            Enter the details for the examination.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-3 rounded-md flex items-center gap-2 text-sm border border-rose-200">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="exam_name">Exam Name</Label>
                            <Input
                                id="exam_name"
                                value={formData.exam_name}
                                onChange={e => setFormData({ ...formData, exam_name: e.target.value })}
                                placeholder="e.g. Mid-Term Physics"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="course">Class & Subject</Label>
                            <Select
                                value={formData.section_id && formData.subject_id ? `${formData.section_id}|${formData.subject_id}` : ""}
                                onValueChange={v => {
                                    const [secId, subId] = v.split('|');
                                    setFormData({ ...formData, section_id: secId, subject_id: subId });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignedCourses.map((course, idx) => (
                                        <SelectItem key={idx} value={`${course.section_id}|${course.subject_id}`}>
                                            {course.section} - {course.subject}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="exam_date">Date</Label>
                                <Input
                                    id="exam_date"
                                    type="date"
                                    value={formData.exam_date}
                                    onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="total_marks">Total Marks</Label>
                                <Input
                                    id="total_marks"
                                    type="number"
                                    min="1"
                                    value={formData.total_marks}
                                    onChange={e => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Chapters, syllabus, etc."
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingItem ? 'Update Exam' : 'Schedule Exam')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeacherExams;
