
import React from 'react';

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

const PublicPageLayout: React.FC<PublicPageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} QuantaReport. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PublicPageLayout;
