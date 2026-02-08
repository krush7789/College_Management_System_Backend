import PropTypes from 'prop-types';

function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="flex min-h-screen">
            <div className="flex-1 bg-zinc-900 flex flex-col items-center justify-center p-8 relative overflow-hidden text-white">
                <div className="relative z-10 text-center max-w-lg">
                    <h2 className="text-3xl font-bold mb-4">{title}</h2>
                    <p className="text-xl text-zinc-300">{subtitle}</p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-primary mb-1">UniPortal</h1>
                        <p className="text-muted-foreground">University Management System</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
};

export default AuthLayout;
