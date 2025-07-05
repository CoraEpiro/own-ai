import React from 'react';
import AuthForm from '../components/AuthForm';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm />
    </div>
  );
};

export default AuthPage; 