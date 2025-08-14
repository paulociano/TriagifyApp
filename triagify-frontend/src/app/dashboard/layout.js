'use client'; // 1. Tornamos o layout um Componente de Cliente

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  // Estado para controlar se a verificação foi concluída
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // 2. A lógica de proteção agora vive diretamente no layout
    const token = localStorage.getItem('triagify-token');
    if (!token) {
      router.push('/login');
    } else {
      setIsVerified(true);
    }
  }, [router]);

  // 3. Enquanto verifica, não mostra nada para evitar um flash de conteúdo
  if (!isVerified) {
    return null; 
  }

  // 4. Se verificado, renderiza a estrutura do dashboard com o conteúdo
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}