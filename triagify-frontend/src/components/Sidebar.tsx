'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

// Tipo para o nosso token
interface CustomJwtPayload {
    fullName: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('triagify-token');
        if (token) {
            try {
                const decodedToken = jwtDecode<CustomJwtPayload>(token);
                setUserName(decodedToken.fullName);
            } catch (error) {
                console.error("Token inválido:", error);
            }
        }
    }, []);

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Pacientes', href: '/dashboard/pacientes', icon: <Users size={20} /> },
        { name: 'Configurações', href: '/dashboard/configuracoes', icon: <Settings size={20} /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem('triagify-token');
        window.location.href = '/login';
    };

    return (
        <aside className="w-64 flex-shrink-0 bg-white shadow-md flex flex-col">
            <div className="h-20 flex items-center justify-center border-b">
                <Image 
                    src="/triagify-logo.svg" 
                    alt="Logo Triagify" 
                    width={200} 
                    height={200}
                    priority
                    style={{ height: 'auto' }}
                />
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-[#02bca5] text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <div className="mr-3">{link.icon}</div>
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="px-4 py-4 border-t">
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-800 truncate">{userName || 'Carregando...'}</p>
                    <p className="text-xs text-gray-500">Médico(a)</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-gray-600 hover:text-[#02bca5] transition-colors"
                >
                    <LogOut size={20} />
                    <span className="ml-3 font-medium">Sair</span>
                </button>
            </div>
        </aside>
    );
}
