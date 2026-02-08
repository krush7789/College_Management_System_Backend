import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

const loginSchema = Yup.object({
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

function Login() {
    const navigate = useNavigate();
    const { login, loading } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (values) => {
        const result = await login(values.email, values.password);

        console.log("Login result:", result);
        if (result.success) {
            // Ensure role exists and is normalized
            const rawRole = result.user?.role;
            const role = rawRole?.toLowerCase();

            console.log("Processing role navigation:", { rawRole, role });

            if (role === 'admin') {
                console.log("Navigating to Admin Dashboard");
                navigate('/admin/dashboard');
            } else if (role === 'teacher') {
                console.log("Navigating to Teacher Dashboard");
                navigate('/teacher/dashboard');
            } else if (role === 'student') {
                console.log("Navigating to Student Dashboard");
                navigate('/student/dashboard');
            } else {
                console.error("Unknown role encountered:", role);
                // Fallback or error
                setError(`Unknown role: ${role}`);
            }
        } else {
            console.warn("Login failed:", result.error);
            setError(result.error);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back!"
            subtitle="Sign in to continue to UniPortal"
        >
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="space-y-1 pb-6 px-0">
                    <CardTitle className="text-2xl font-bold text-center">Sign in to your account</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-0">
                    <Formik
                        initialValues={{ email: '', password: '', rememberMe: false }}
                        validationSchema={loginSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, isSubmitting, handleChange, handleBlur, values }) => (
                            <Form className="space-y-4">
                                {error && (
                                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md font-medium text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.email}
                                        className={errors.email && touched.email ? "border-red-500" : ""}
                                    />
                                    {errors.email && touched.email && (
                                        <p className="text-xs text-red-500 font-medium">{errors.email}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            to="/forgot-password"
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.password}
                                        className={errors.password && touched.password ? "border-red-500" : ""}
                                    />
                                    {errors.password && touched.password && (
                                        <p className="text-xs text-red-500 font-medium">{errors.password}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Field
                                        type="checkbox"
                                        name="rememberMe"
                                        as={Checkbox}
                                        id="rememberMe"
                                    />
                                    <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                        Remember me
                                    </Label>
                                </div>

                                <Button className="w-full" type="submit" disabled={isSubmitting || loading}>
                                    {isSubmitting || loading ? "Signing in..." : "Sign In"}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground px-0">
                    <div>
                        Contact your administrator if you don't have an account.
                    </div>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
}

export default Login;
