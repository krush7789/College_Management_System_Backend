import { useState, useEffect } from 'react';
import { dashboard } from '@/services/api';

export const useStudentDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Call all student dashboard APIs in parallel
                const [statsRes, timetableRes, resultsRes] = await Promise.all([
                    dashboard.getStudentStats(),
                    dashboard.getStudentTimetable(),
                    dashboard.getStudentResults()
                ]);

                // Combine all the data
                const combinedStats = {
                    ...statsRes.data,
                    today_classes: timetableRes.data?.today_classes || [],
                    course_progress: statsRes.data?.course_progress || [],
                    exam_results: resultsRes.data || []
                };

                setStats(combinedStats);

            } catch (err) {
                console.error("Failed to fetch student stats:", err);
                setError("Could not load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return { stats, loading, error };
};
