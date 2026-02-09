import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // 1. Get Refresh Token
                const refreshToken = Cookies.get('refresh_token');

                if (refreshToken) {
                    console.log("Attempting to refresh token...");

                    // 2. Call Refresh Endpoint (use base axios to avoid interceptor loop)
                    const res = await axios.post('http://localhost:8000/api/auth/refresh', {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    });

                    const { access_token, refresh_token: newRefreshToken } = res.data;

                    // 3. Update Storage - Check where it was stored originally
                    if (localStorage.getItem('access_token')) {
                        localStorage.setItem('access_token', access_token);
                    } else {
                        sessionStorage.setItem('access_token', access_token);
                    }

                    if (newRefreshToken) {
                        Cookies.set('refresh_token', newRefreshToken, { expires: 7 });
                    }

                    console.log("Token refreshed successfully.");

                    // 4. Update Header for original request
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;

                    // 5. Update default header for future requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                    // 6. Retry original request
                    return api(originalRequest);
                } else {
                    console.warn("No refresh token found. Redirecting to login.");
                }
            } catch (refreshError) {
                console.error("Session expired or refresh failed:", refreshError);
                // Clear artifacts
                localStorage.removeItem('access_token');
                sessionStorage.removeItem('access_token');
                Cookies.remove('refresh_token');
                // Force redirect
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Generic CRUD helpers
export const crud = (resource) => ({
    getAll: (params) => api.get(`/${resource}`, { params }),
    get: (id) => api.get(`/${resource}/${id}`),
    create: (data) => api.post(`/${resource}`, data),
    update: (id, data) => api.put(`/${resource}/${id}`, data),
    delete: (id) => api.delete(`/${resource}/${id}`),
});

export const branches = {
    getAll: (params) => api.get('/admin/branches', { params }),
    create: (data) => api.post('/admin/branches', data),
    update: (id, data) => api.patch(`/admin/branches/${id}`, data),
};
export const semesters = {
    getAll: (params) => api.get('/admin/semesters', { params }),
    get: (id) => api.get(`/admin/semesters/${id}`),
    create: (data) => api.post('/admin/semesters', data),
    update: (id, data) => api.patch(`/admin/semesters/${id}`, data),
};
export const sections = {
    getAll: (params) => api.get('/admin/sections', { params }),
    get: (id) => api.get(`/admin/sections/${id}`),
    getStats: (id) => api.get(`/admin/sections/${id}/stats`),
    create: (data) => api.post('/admin/sections', data),
    update: (id, data) => api.patch(`/admin/sections/${id}`, data),
};
export const subjects = crud('subjects');
export const users = {
    ...crud('users'),
    get: (id) => api.get(`/users/${id}`),
    createStudent: (data) => api.post('/users/student', data),
    createTeacher: (data) => api.post('/users/teacher', data),
    createAdmin: (data) => api.post('/users/admin', data),
    importCSV: (role, file) => {
        const formData = new FormData();
        formData.append('file', file);
        // Backend expects lowercase roles (student, teacher)
        const roleLower = role.toLowerCase();
        return api.post(`/users/bulk-import?role=${roleLower}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
export const dashboard = {
    getPerformance: () => api.get('/dashboard/admin/performance'),
    getStats: () => api.get('/dashboard/admin/stats'),
    getDefaulters: (threshold) => api.get('/dashboard/admin/defaulters', { params: { threshold } }),
    getStudentStats: () => api.get('/dashboard/student'),
    getTeacherStats: () => api.get('/dashboard/teacher'),
    getClassPerformance: (params) => api.get('/dashboard/teacher/class-performance', { params }),

    // Student Endpoints
    getStudentTimetable: () => api.get('/dashboard/student/timetable'),
    getStudentResults: () => api.get('/dashboard/student/results'),

    // Teacher Endpoints
    getTeacherTimetable: () => api.get('/dashboard/teacher/timetable'),
    getExamPerformanceTrends: (params) => api.get('/dashboard/teacher/exam-performance', { params }),
};
export const attendance = {
    // Attendance
    getStudentAttendanceSummary: () => api.get('/attendance/my-summary'),
    getStudentAttendanceRecords: (params) => api.get('/attendance/my-records', { params }),

    // Teacher Attendance Management
    getSectionStudents: (sectionId) => api.get(`/attendance/section/${sectionId}/students`),
    getAttendanceForDate: (sectionId, subjectId, date) =>
        api.get(`/attendance/section/${sectionId}/subject/${subjectId}/date/${date}`),
    markBulkAttendance: (data) => api.post('/attendance/bulk', data),
    getAttendanceHistory: (sectionId, subjectId, params) =>
        api.get('/attendance/history', { params: { section_id: sectionId, subject_id: subjectId, ...params } }),
};
export const electives = {
    getAvailable: () => api.get('/electives/available'),
    getMySelections: () => api.get('/electives/my-selections'),
    select: (subjectId) => api.post(`/electives/select/${subjectId}`),
    bulkSelect: (subjectIds) => api.post('/electives/bulk-select', subjectIds),
};
export const teacherAssignments = {
    ...crud('admin/teacher-assignments'),
    getByTeacher: (teacherId) => api.get(`/admin/teacher-assignments/teacher/${teacherId}`),
    getBySection: (sectionId) => api.get(`/admin/teacher-assignments/section/${sectionId}`),
};

export const exams = {
    ...crud('exams'),
    getMarks: (examId) => api.get(`/exams/${examId}/marks`),
    submitMarks: (examId, data) => api.post(`/exams/${examId}/marks`, data),
    reviewMarks: (examId, markIds, status) => api.patch(`/exams/${examId}/marks/review`, { mark_ids: markIds, status })
};

export const leaves = crud('leaves');
export const announcements = {
    ...crud('announcements'),
    getAdminAll: () => api.get('/announcements/admin'),
    getForStudent: () => api.get('/announcements'),
    delete: (id) => api.patch(`/announcements/${id}/deactivate`),
};



export const common = {
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default api;

