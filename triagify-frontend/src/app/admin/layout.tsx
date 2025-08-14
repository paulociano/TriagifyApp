'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, ShieldCheck } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface AdminJwtPayload {
    role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('triagify-token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const decodedToken = jwtDecode<AdminJwtPayload>(token);
      if (decodedToken.role !== 'ADMIN') {
        toast.error('Acesso negado.');
        router.push('/login'); // Se não for admin, expulsa
      } else {
        setIsVerified(true);
      }
    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('triagify-token');
    window.location.href = '/login';
  };

  if (!isVerified) {
    return null; // Ou um ecrã de carregamento
  }

  return (
    <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <ShieldCheck className="text-red-600" size={32} />
                    <span className="ml-3 text-lg font-bold text-gray-800">Painel de Administração</span>
                </div>
                <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-red-600">
                    <LogOut size={20} className="mr-2" /> Sair
                </button>
            </div>
        </header>
        <main className="container mx-auto p-6 md:p-8">
            {children}
        </main>
    </div>
  );
}