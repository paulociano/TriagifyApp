'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut } from 'lucide-react';

function PatientHeader() {
    const handleLogout = () => {
        localStorage.removeItem('triagify-token');
        window.location.href = '/login';
    };

    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Image src="/triagify-logo.svg" alt="Logo Triagify" width={32} height={32} />
                    <span className="ml-3 text-lg font-bold text-gray-800">Portal do Paciente</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                >
                    <LogOut size={20} className="mr-2" />
                    Sair
                </button>
            </div>
        </header>
    );
}


export default function PatientDashboardLayout({ children }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('triagify-token');
    if (!token) {
      router.push('/login');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  if (!isVerified) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <PatientHeader />
        <main className="container mx-auto p-6 md:p-8">
            {children}
        </main>
    </div>
  );
}
