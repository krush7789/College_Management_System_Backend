import { useState, useEffect } from 'react';
import { dashboard } from '@/services/api';

export const useAdminDashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        branches: 0,
        sections: 0,
        semesters: 0,
        pending_leaves: 0,
        active_exams: 0
    });
    const [performanceData, setPerformanceData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [examPerformance, setExamPerformance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Parallel fetch: Stats (Counts + Activity) AND Branch Performance
                const [statsRes, perfRes] = await Promise.all([
                    dashboard.getStats(),
                    dashboard.getPerformance()
                ]);

                console.log('Admin Dashboard - Stats Response:', statsRes.data);
                console.log('Admin Dashboard - Performance Response:', perfRes.data);

                // Assuming backend returns structure: { counts: {...}, recent_activity: [...], exam_performance: [...] }
                const { counts, recent_activity, exam_performance } = statsRes.data;

                setStats(counts || {
                    students: 0,
                    teachers: 0,
                    branches: 0,
                    sections: 0,
                    semesters: 0,
                    pending_leaves: 0,
                    active_exams: 0
                });
                setRecentActivity(recent_activity || []);
                setExamPerformance(exam_performance || []);
                setPerformanceData(perfRes.data || []);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError(err.response?.data || err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return {
        stats,
        performanceData,
        recentActivity,
        examPerformance,
        loading,
        error
    };
};
