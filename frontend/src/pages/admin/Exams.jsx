import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exams, sections, subjects } from '../../services/api';
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
import { Plus, Trash2, Search, BookOpen, AlertCircle, Layers, Calendar, Eye, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { SectionSelect } from '@/components/SectionSelect';

const initialFormData = {
    exam_name: '',
    section_id: '',
    subject_id: '',
    exam_date: '',
    total_marks: 100,
    description: ''
};

const AdminExams = () => {
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
        queryKey: ['admin-exams', page, searchTerm],
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

    const { data: allSubjects = [] } = useQuery({
        queryKey: ['subjects', 'all'], // Consistent with other pages
        queryFn: async () => {
            const res = await subjects.getAll({ limit: 100 });
            return res.data.items || [];
        }
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data) => exams.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-exams']);
            setIsModalOpen(false);
            setFormData(initialFormData);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to create exam.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => exams.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-exams']);
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData(initialFormData);
            setError('');
        },
        onError: (err) => setError(err.response?.data?.detail || 'Failed to update exam.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => exams.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['admin-exams']),
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
        <div className="space-y-6 animate-in fade-in duration-500">
            <SectionHeader
                title="Exams"
                subtitle="Create and schedule examinations"
                actions={
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-2xl h-12 px-6 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Exam
                    </Button>
                }
            />

            <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white/70 backdrop-blur-xl">
                <CardHeader className="p-8 border-b border-slate-100 bg-[#fafafa]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 w-full md:w-96 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                            <Search className="w-5 h-5 text-slate-400 ml-2" />
                            <Input
                                placeholder="Search by exam name..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="border-0 focus-visible:ring-0 px-0 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Exam Info</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Class & Subject</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Date</th>
                                <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest text-center min-w-[100px]">Marks</th>
                                <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest min-w-[100px]">Actions</th>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell>
                                    </TableRow>
                                ))
                            ) : examsList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-20 text-center">
                                        <div className="inline-flex p-6 bg-slate-50 rounded-full mb-4 text-slate-300">
                                            <Calendar className="w-12 h-12" />
                                        </div>
                                        <p className="text-slate-400 font-bold block mb-1">No exams found</p>
                                        <p className="text-sm text-slate-300">Try adjusting your filters or search term</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                examsList.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-900 text-lg leading-none mb-1">{item.exam_name}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.description || 'No description'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span className="text-sm font-bold text-slate-600">{item.section?.name || 'Unknown Section'}</span>
                                                </div>
                                                <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold rounded-lg px-2">
                                                    {item.subject?.name || 'Unknown Subject'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">{format(new Date(item.exam_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-center text-lg font-black text-indigo-600">
                                            {item.total_marks}
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => !deleteMutation.isPending && window.confirm('Are you sure?') && deleteMutation.mutate(item.id)}
                                                    className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="rounded-xl border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-600"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <Button
                                key={p}
                                variant={page === p ? "default" : "ghost"}
                                onClick={() => setPage(p)}
                                className={`h-10 w-10 rounded-xl font-bold transition-all ${page === p
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                                    : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                                    }`}
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="rounded-xl border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-600"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-[#fafafa] p-8 border-b border-slate-100">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900">
                                    {editingItem ? 'Edit Examination' : 'Create New Examination'}
                                </DialogTitle>
                                <DialogDescription className="font-medium text-slate-500">
                                    Define exam details, schedule and requirements.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 animate-in fade-in zoom-in duration-300">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Exam Name</Label>
                                    <Input
                                        placeholder="e.g. Mid-Term 2026, Semester Final"
                                        value={formData.exam_name}
                                        onChange={e => setFormData({ ...formData, exam_name: e.target.value })}
                                        className="h-12 rounded-2xl border-slate-200 focus:ring-indigo-500/20 px-5 font-semibold"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Section</Label>
                                        <SectionSelect
                                            value={formData.section_id}
                                            onChange={(val) => setFormData({ ...formData, section_id: val })}
                                            placeholder="Select Section"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</Label>
                                        <Select
                                            value={formData.subject_id}
                                            onValueChange={v => setFormData({ ...formData, subject_id: v })}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 font-semibold px-5">
                                                <SelectValue placeholder="Select Subject" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100">
                                                {allSubjects.map(sub => (
                                                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.exam_date}
                                            onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                                            className="h-12 rounded-2xl border-slate-200 font-semibold px-5"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Marks</Label>
                                        <Input
                                            type="number"
                                            value={formData.total_marks}
                                            onChange={e => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                                            className="h-12 rounded-2xl border-slate-200 font-semibold px-5"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</Label>
                                    <Input
                                        placeholder="Add some details about the exam..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="h-12 rounded-2xl border-slate-200 font-semibold px-5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 flex gap-3 justify-end items-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="h-12 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="h-12 px-8 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full" />
                                ) : (
                                    editingItem ? 'Save Changes' : 'Create Examination'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminExams;
