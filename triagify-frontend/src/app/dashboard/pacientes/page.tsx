'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

// Tipos para os dados
interface Patient {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para a paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Efeito para a pesquisa (com debounce)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            // Quando a pesquisa muda, volta sempre para a primeira página
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchPatients();
            }
        }, 300); // Espera 300ms após o utilizador parar de digitar

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Efeito para a mudança de página
    useEffect(() => {
        fetchPatients();
    }, [currentPage]); // Re-executa quando a página atual muda

    const fetchPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('triagify-token');
            if (!token) throw new Error('Token não encontrado.');

            // Constrói a URL com os parâmetros de pesquisa e página
            const response = await fetch(`http://localhost:3001/api/patients?search=${searchTerm}&page=${currentPage}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Falha ao buscar dados dos pacientes.');

            const { data, pagination } = await response.json();
            setPatients(data);
            setTotalPages(pagination.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Meus Pacientes</h1>
                <button className="bg-[#02bca5] text-white font-semibold px-4 py-2 rounded-lg flex items-center hover:bg-[#02bca5]/50 transition-colors">
                    <UserPlus size={20} className="mr-2" />
                    Adicionar Paciente
                </button>
            </div>

            <div className="mb-6 relative">
                <input 
                    type="text"
                    placeholder="Pesquisar por nome ou e-mail..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02bca5]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Completo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="text-center p-10">
                                    <Loader2 className="animate-spin inline-block mr-2" />Carregando...
                                </td>
                            </tr>
                        ) : error ? (
                             <tr>
                                <td colSpan={4} className="text-center p-10 text-red-500">
                                    <AlertTriangle className="inline-block mr-2" />{error}
                                </td>
                            </tr>
                        ) : patients.length > 0 ? patients.map((patient) => (
                            <tr key={patient.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link href={`/dashboard/pacientes/${patient.id}`} className="text-[#02bca5] hover:text-[#02bca5]/50">
                                        Ver Perfil
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center p-10 text-gray-500">Nenhum paciente encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- CONTROLES DE PAGINAÇÃO --- */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1 || isLoading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} className="mr-2" />
                        Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || isLoading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próxima
                        <ChevronRight size={16} className="ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
}
