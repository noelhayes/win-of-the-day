'use client';

import { Navbar } from '../../components';

export default function AuthenticatedLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
    </div>
  );
}
