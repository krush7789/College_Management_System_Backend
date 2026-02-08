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

const StudentElectiveSelection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [availableElectives, setAvailableElectives] = useState([]);
    const [selectionStatus, setSelectionStatus] = useState("pending"); // pending, submitted, approved

    const formik = useFormik({
        initialValues: {
            electives: []
        },
        validationSchema: Yup.object({
            electives: Yup.array()
                .min(2, "You must select exactly 2 electives")
                .max(2, "You can only select up to 2 electives")
                .required("Please select electives")
        }),
        onSubmit: async (values) => {
            try {
                // Determine actions: since we only have 'select' endpoint, we'll iterate and select.
                // Note: Real implementation might need a 'bulk select' or handling unselects.
                // Assuming 'select' is idempotent or creates a record.

                await Promise.all(values.electives.map(subjectId => electivesApi.select(subjectId)));

                // await new Promise(resolve => setTimeout(resolve, 1000));

                setSelectionStatus("submitted");
                toast({
                    title: "Success",
                    description: "Elective choices submitted successfully.",
                });
            } catch (error) {
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
                    setSelectionStatus("submitted"); // Assume if they have selections, it's submitted
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
            formik.setFieldValue(
                'electives',
                currentSelection.filter(id => id !== electiveId)
            );
        } else {
            if (currentSelection.length >= 2) {
                toast({
                    title: "Limit Reached",
                    description: "You can only select up to 2 electives.",
                    variant: "destructive"
                });
                return;
            }
            formik.setFieldValue('electives', [...currentSelection, electiveId]);
        }
    };

    if (loading && availableElectives.length === 0) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto p-8">
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
                        Please select <strong>2</strong> electives from the list below. Seats are allocated on a first-come-first-serve basis.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableElectives.map((course) => {
                        const isSelected = formik.values.electives.includes(course.id);
                        const isFull = course.filled >= course.seats;

                        return (
                            <Card key={course.id} className={`shadow-sm border-slate-200 transition-all ${isSelected ? 'ring-2 ring-indigo-600 bg-indigo-50/10' : ''} ${isFull && !isSelected ? 'opacity-75 bg-slate-50' : ''}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="bg-white text-slate-600 border-slate-200">
                                            {course.code}
                                        </Badge>
                                        {isFull && !isSelected && (
                                            <Badge variant="destructive" className="uppercase text-[10px]">Full</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 mt-2">{course.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">{course.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm pb-4">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        <span>{course.faculty}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <span>{course.credits} Credits</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-medium ${course.filled / course.seats > 0.9 ? 'text-amber-600' : 'text-slate-600'}`}>
                                                {course.filled}/{course.seats}
                                            </span>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${course.filled / course.seats > 0.9 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${(course.filled / course.seats) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button
                                        className={`w-full ${isSelected ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : 'bg-primary hover:bg-primary/90'}`}
                                        variant={isSelected ? 'outline' : 'default'}
                                        disabled={isSubmitted || (isFull && !isSelected)}
                                        onClick={() => handleSelect(course.id)}
                                    >
                                        {isSelected ? "Remove Selection" : isFull ? "Seats Full" : "Select Course"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {!isSubmitted && (
                    <div className="fixed bottom-6 right-6 z-10">
                        <Card className="shadow-lg border-slate-200 p-4 flex items-center gap-4 bg-white/80 backdrop-blur-sm">
                            <div>
                                <p className="text-sm font-medium text-slate-600">Selected: {formik.values.electives.length}/2</p>
                            </div>
                            <Button
                                type="submit"
                                disabled={formik.values.electives.length !== 2 || loading || formik.isSubmitting}
                                className="bg-primary hover:bg-primary/90 shadow-md"
                            >
                                {formik.isSubmitting ? "Submitting..." : "Submit Choices"}
                            </Button>
                        </Card>
                    </div>
                )}
            </form>
        </div>
    );
};

export default StudentElectiveSelection;
