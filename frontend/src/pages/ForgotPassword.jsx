import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import AuthLayout from '../components/AuthLayout';
import api from '../services/api';

const forgotPasswordSchema = Yup.object({
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
});

function ForgotPassword() {
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (values, { setSubmitting }) => {
        setError('');

        try {
            await api.post('/auth/forgot-password', { email: values.email });
            setSubmitted(true);
        } catch (err) {
            console.error('Forgot password failed:', err);
            setSubmitted(true);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <AuthLayout
                title="Check Your Email"
                subtitle="We've sent you a password reset link"
            >
                <div className="text-center">
                    <div className="mb-6">
                        <svg
                            width="80"
                            height="80"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-success)"
                            strokeWidth="1.5"
                            style={{ margin: '0 auto' }}
                        >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>

                    <p className="mb-6">
                        If an account exists with that email address, we have sent a <strong>temporary password</strong> to your email.
                    </p>

                    <p className="text-sm text-muted mb-6">
                        Please login with this temporary password to access your account.
                    </p>

                    <Link to="/login" className="btn btn-outline btn-block">
                        Back to Login
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Forgot Password?"
            subtitle="No worries, we'll send you reset instructions"
        >
            <Formik
                initialValues={{ email: '' }}
                validationSchema={forgotPasswordSchema}
                onSubmit={handleSubmit}
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form>
                        {error && (
                            <div className="alert alert-error mb-6">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4M12 16h.01" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <div className="input-group">
                                <span className="input-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </span>
                                <Field
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={`form-input ${errors.email && touched.email ? 'error' : ''}`}
                                    placeholder="you@university.edu"
                                />
                            </div>
                            {errors.email && touched.email && (
                                <span className="form-error">{errors.email}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block btn-lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner"></span>
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>

                        <div className="auth-footer">
                            <Link to="/login">
                                ← Back to Login
                            </Link>
                        </div>
                    </Form>
                )}
            </Formik>
        </AuthLayout>
    );
}

export default ForgotPassword;
