'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, CheckCircle, Loader2, AlertTriangle, Check } from 'lucide-react';

// Tipos para os dados
interface PendingScreening {
  id: string;
  updatedAt: string;
  patient: {
    fullName: string;
  };
}

// Componente de Card para o resumo
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className={`w-12 h-12 flex items-center justify-center rounded-full ${color} text-white mr-4`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export default function DashboardPage() {
    const [reviewedTodayCount, setReviewedTodayCount] = useState<number>(0);
    const [pendingScreenings, setPendingScreenings] = useState<PendingScreening[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('triagify-token');
                if (!token) throw new Error('Utilizador não autenticado.');

                const [pendingResponse, reviewedResponse] = await Promise.all([
                    fetch('http://localhost:3001/api/screenings/pending-review', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch('http://localhost:3001/api/screenings/reviewed-today-count', {
                        headers: { 'Authorization': `Bearer ${token}` },
                    })
                ]);

                if (!pendingResponse.ok) throw new Error('Falha ao buscar as triagens pendentes.');
                if (!reviewedResponse.ok) throw new Error('Falha ao buscar a contagem de triagens analisadas.');

                const pendingData = await pendingResponse.json();
                const reviewedData = await reviewedResponse.json();

                setPendingScreenings(pendingData);
                setReviewedTodayCount(reviewedData.count); // Assumindo que a resposta seja { count: X }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Visão Geral</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="Triagens para Analisar" value={pendingScreenings.length} icon={<ClipboardList size={24}/>} color="bg-[#02bca5]" />
                <StatCard 
                    title="Triagens Analisadas (Hoje)" 
                    value={isLoading ? '...' : reviewedTodayCount} 
                    icon={<CheckCircle size={24}/>} 
                    color="bg-[#02bca5]" // Cor alterada para indicar sucesso/conclusão
                />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">Triagens Pendentes de Análise</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {isLoading ? (
                    <div className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />A carregar triagens...</div>
                ) : error ? (
                    <div className="text-center p-10 text-red-500"><AlertTriangle className="inline-block mr-2" />{error}</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Conclusão</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendingScreenings.length > 0 ? pendingScreenings.map((screening) => (
                                <tr key={screening.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{screening.patient.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(screening.updatedAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                            Aguardando Análise
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/dashboard/screening/${screening.id}`} className="text-blue-600 hover:text-[#02bca5]">
                                            Analisar Triagem
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-10 text-gray-500">Nenhuma triagem pendente de análise. Bom trabalho!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
