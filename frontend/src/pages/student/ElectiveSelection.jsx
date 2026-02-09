import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboard, electives as electivesApi } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Users, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as Yup from "yup";
import SectionHeader from '@/components/SectionHeader';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

const StudentElectiveSelection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [availableElectives, setAvailableElectives] = useState([]);
    const [selectionStatus, setSelectionStatus] = useState("pending"); // pending, submitted, approved
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingSelection, setPendingSelection] = useState(null);

    const formik = useFormik({
        initialValues: {
            electives: []
        },
        validationSchema: Yup.object({
            electives: Yup.array()
                .required("Please select electives")
        }),
        onSubmit: async (values) => {
            try {
                await electivesApi.bulkSelect(values.electives);

                setSelectionStatus("submitted");
                setIsConfirmOpen(false);
                setPendingSelection(null);
                toast({
                    title: "Success",
                    description: "Elective choices updated successfully.",
                });
            } catch (error) {
                setIsConfirmOpen(false);
                setPendingSelection(null);
                toast({
                    title: "Error",
                    description: "Failed to submit selection.",
                    variant: "destructive"
                });
            }
        }
    });

    useEffect(() => {
        fetchElectives();
    }, []);

    const fetchElectives = async () => {
        try {
            setLoading(true);
            // Fetch available electives
            const res = await electivesApi.getAvailable();
            setAvailableElectives(Array.isArray(res.data) ? res.data : []);

            // Fetch current selection
            try {
                const sel = await electivesApi.getMySelections();
                // Assuming response structure { data: [id1, id2] } or { data: { electives: [...] } }
                // Adjust based on actual API response. Let's assume it returns list of selected IDs or objects.
                const selectedIds = Array.isArray(sel.data) ? sel.data.map(s => s.id || s) : (sel.data.electives || []);

                if (selectedIds.length > 0) {
                    formik.setFieldValue('electives', selectedIds);
                    setSelectionStatus("submitted");
                }
            } catch (err) {
                // Ignore 404 if no selection found
                console.log("No previous selection found");
            }

        } catch (error) {
            console.error("Error fetching electives:", error);
            if (error.response) {
                console.error("Error Response Data:", error.response.data);
                console.error("Error Response Status:", error.response.status);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (electiveId) => {
        const currentSelection = formik.values.electives;
        if (currentSelection.includes(electiveId)) {
            // Remove
            formik.setFieldValue(
                'electives',
                currentSelection.filter(id => id !== electiveId)
            );
        } else {
            // Selecting - show dialog first
            setPendingSelection(electiveId);
            setIsConfirmOpen(true);
        }
    };

    const handleConfirm = () => {
        if (pendingSelection) {
            // Local confirmation: Add to list, but don't submit to backend yet
            const currentSelection = formik.values.electives;
            if (!currentSelection.includes(pendingSelection)) {
                formik.setFieldValue('electives', [...currentSelection, pendingSelection]);
            }
            setPendingSelection(null);
            setIsConfirmOpen(false);
        } else {
            // Global submission: Submit all choices to backend
            formik.submitForm();
        }
    };

    const pendingSubject = availableElectives.find(e => e.id === pendingSelection);

    if (loading && availableElectives.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </div>
            </div>
        );
    }

    const isSubmitted = selectionStatus !== 'pending';

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Elective Selection"
                subtitle="Choose your elective courses for the upcoming semester"
            />

            {isSubmitted ? (
                <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Selection Submitted</AlertTitle>
                    <AlertDescription>
                        Your choices have been recorded. You will be notified once the allocation is finalized.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert className="bg-indigo-50 border-indigo-200 text-indigo-800">
                    <Info className="h-4 w-4 text-indigo-600" />
                    <AlertTitle>Selection Open</AlertTitle>
                    <AlertDescription>
                        Please select your preferred elective subject(s) from the list below. You can also leave it empty if you don't wish to opt for any.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableElectives
                        .filter(course => !isSubmitted || formik.values.electives.includes(course.id))
                        .map((course) => {
                            const isSelected = formik.values.electives.includes(course.id);
                            const isFull = course.filled >= course.seats;

                            return (
                                <Card key={course.id} className={`shadow-sm border-slate-200 transition-all ${isSelected ? 'ring-2 ring-indigo-600 bg-indigo-50/10' : ''} ${isFull && !isSelected ? 'opacity-75 bg-slate-50' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="bg-white text-slate-600 border-slate-200">
                                                {course.code}
                                            </Badge>
                                            {isSubmitted ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Enrolled</Badge>
                                            ) : isFull && !isSelected && (
                                                <Badge variant="destructive" className="uppercase text-[10px]">Full</Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg font-semibold text-slate-900 mt-2">{course.name}</CardTitle>
                                        <CardDescription className="line-clamp-2 mt-1">{course.description}</CardDescription>
                                    </CardHeader>
                                    {!isSubmitted && (
                                        <CardFooter className="pt-0">
                                            <Button
                                                type="button"
                                                className={`w-full ${isSelected ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : 'bg-primary hover:bg-primary/90'}`}
                                                variant={isSelected ? 'outline' : 'default'}
                                                disabled={isSubmitted || (isFull && !isSelected)}
                                                onClick={() => handleSelect(course.id)}
                                            >
                                                {isSelected ? "Remove Selection" : isFull ? "Seats Full" : "Select Course"}
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            );
                        })}
                </div>

                {!isSubmitted && (
                    <div className="fixed bottom-6 right-6 z-10">
                        <Card className="shadow-lg border-slate-200 p-4 flex items-center gap-4 bg-white/80 backdrop-blur-sm">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Selected: {formik.values.electives.length}</p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setIsConfirmOpen(true)}
                                disabled={loading || formik.isSubmitting || formik.values.electives.length === 0}
                                className="bg-primary hover:bg-primary/90 shadow-md"
                            >
                                {formik.isSubmitting ? "Submitting..." : "Submit Choices"}
                            </Button>
                        </Card>
                    </div>
                )}
            </form>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            {pendingSelection ? "Confirm Course Selection" : "Submit Final Choices"}
                        </DialogTitle>
                        <DialogDescription className="py-4">
                            {pendingSelection
                                ? `Do you want to add "${pendingSubject?.name || 'this subject'}" to your selection? You can add more subjects before submitting.`
                                : "Are you sure you want to submit your final elective choices? This will lock your selection for the semester."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmOpen(false)}
                            disabled={formik.isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={formik.isSubmitting}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {formik.isSubmitting ? "Submitting..." : "Confirm Selection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StudentElectiveSelection;
