import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoutes from './components/ProtectedRoutes';
import PublicRoute from './components/PublicRoute';
import Login from './pages/login';
import ForgotPassword from './pages/ForgotPassword';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Branches from './pages/admin/Branches';
import AdminExams from './pages/admin/Exams';
import Semesters from './pages/admin/Semesters';
import Sections from './pages/admin/Sections';
import Subjects from './pages/admin/Subjects';
import Students from './pages/admin/Students';
import Teachers from './pages/admin/Teachers';
import TeacherAssignments from './pages/admin/TeacherAssignments';
import StudentDashboard from './pages/student/Dashboard';
import StudentLeaveApplication from './pages/student/LeaveApplication';
import StudentResults from './pages/student/Results';
import StudentTimetable from './pages/student/Timetable';
import StudentAttendance from './pages/student/Attendance';
import StudentElectiveSelection from './pages/student/ElectiveSelection';
import StudentAnnouncements from './pages/student/Announcements';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherLeaveApprovals from './pages/teacher/LeaveApprovals';
import ClassPerformance from './pages/teacher/ClassPerformance';
import ExamMarksEntry from './pages/teacher/ExamMarksEntry';
import ExamMarksReview from './pages/admin/ExamMarksReview';
// Settings page removed - using Profile page instead
import Announcements from './pages/admin/Announcements';
import TeacherAnnouncements from './pages/teacher/Announcements';
import TeacherTimetable from './pages/teacher/Timetable';
import TeacherExams from './pages/teacher/Exams';
import Profile from './pages/Profile';
import TeacherLayout from './components/teacher/TeacherLayout';
import StudentLayout from './components/student/StudentLayout';
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = user?.role?.toLowerCase();
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (role === 'student') return <Navigate to="/student/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes with Login Guard */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoutes />}>
              {/* Admin Area */}
              <Route element={<ProtectedRoutes allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="branches" element={<Branches />} />
                  <Route path="semesters" element={<Semesters />} />
                  <Route path="sections" element={<Sections />} />
                  <Route path="subjects" element={<Subjects />} />
                  <Route path="exams" element={<AdminExams />} />
                  <Route path="students" element={<Students />} />
                  <Route path="teachers" element={<Teachers />} />
                  <Route path="assignments" element={<TeacherAssignments />} />
                  <Route path="marks-review" element={<ExamMarksReview />} />
                  <Route path="announcements" element={<Announcements />} />

                  <Route path="profile" element={<Profile />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* Student & Teacher Areas */}
              <Route element={<ProtectedRoutes allowedRoles={['student']} />}>
                <Route path="/student" element={<StudentLayout />}>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="leaves" element={<StudentLeaveApplication />} />
                  <Route path="results" element={<StudentResults />} />
                  <Route path="timetable" element={<StudentTimetable />} />
                  <Route path="attendance" element={<StudentAttendance />} />
                  <Route path="electives" element={<StudentElectiveSelection />} />
                  <Route path="announcements" element={<StudentAnnouncements />} />
                  <Route path="profile" element={<Profile />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoutes allowedRoles={['teacher']} />}>
                <Route path="/teacher" element={<TeacherLayout />}>
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="attendance" element={<TeacherAttendance />} />
                  <Route path="leaves" element={<TeacherLeaveApprovals />} />
                  <Route path="performance" element={<ClassPerformance />} />
                  <Route path="marks-entry" element={<ExamMarksEntry />} />
                  <Route path="exams" element={<TeacherExams />} />
                  <Route path="timetable" element={<TeacherTimetable />} />
                  <Route path="announcements" element={<TeacherAnnouncements />} />
                  <Route path="profile" element={<Profile />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
              </Route>

              {/* Intelligent Redirect */}
              <Route path="/dashboard" element={<RootRedirect />} />
              <Route path="/" element={<RootRedirect />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
