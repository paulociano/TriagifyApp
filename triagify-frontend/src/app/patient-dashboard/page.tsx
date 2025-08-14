'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, History, AlertTriangle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import ScreeningModal from '@/components/ScreeningModal';
import toast from 'react-hot-toast';

// Tipos para os dados
interface CustomJwtPayload {
    fullName: string;
}
interface ScreeningHistoryItem {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'REVIEWED';
  createdAt: string;
}

// Componente para o status da triagem
const StatusBadge = ({ status }: { status: ScreeningHistoryItem['status'] }) => {
    const statusInfo = {
        PENDING: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
        COMPLETED: { text: 'Enviada', color: 'bg-blue-100 text-blue-800' },
        REVIEWED: { text: 'Analisada pelo Médico', color: 'bg-green-100 text-green-800' },
    };
    const info = statusInfo[status] || { text: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${info.color}`}>
            {info.text}
        </span>
    );
};

export default function PatientDashboardPage() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [history, setHistory] = useState<ScreeningHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeScreeningId, setActiveScreeningId] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('triagify-token');
            if (!token) throw new Error('Utilizador não autenticado.');

            const response = await fetch('http://localhost:3001/api/patient/screenings', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Falha ao buscar o histórico.');
            
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            setHistoryError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setHistoryLoading(false);
        }
    };

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
        fetchHistory();
    }, []);

    const handleStartScreening = async () => {
        setIsStarting(true);
        try {
            const token = localStorage.getItem('triagify-token');
            if (!token) throw new Error('Utilizador não autenticado.');
            const response = await fetch('http://localhost:3001/api/screening/start', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Não foi possível iniciar uma nova triagem.');
            const data = await response.json();
            
            setActiveScreeningId(data.screeningId);
            setIsModalOpen(true);

        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleResumeScreening = (id: string) => {
        setActiveScreeningId(id);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setActiveScreeningId(null);
        fetchHistory();
    };

    return (
        <>
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Bem-vindo(a), {userName || 'Paciente'}!
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Pronto(a) para preparar a sua próxima consulta?
                </p>

                <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        Nova Triagem Disponível
                    </h2>
                    <p className="text-gray-600 mb-6">
                        O seu médico solicitou o preenchimento de um formulário de pré-consulta. 
                        Este processo ajuda a otimizar o seu tempo de atendimento e a garantir que todas as suas informações importantes sejam partilhadas.
                    </p>
                    <button 
                        className="bg-blue-500 text-white font-bold px-8 py-3 rounded-lg flex items-center hover:bg-blue-600 transition-transform transform hover:scale-105 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        onClick={handleStartScreening}
                        disabled={isStarting}
                    >
                        {isStarting ? <Loader2 size={20} className="mr-2 animate-spin" /> : <FileText size={20} className="mr-2" />}
                        {isStarting ? 'A iniciar...' : 'Iniciar Triagem'}
                    </button>
                </div>

                <div className="mt-12">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                        <History size={22} className="mr-3 text-gray-500" />
                        Histórico de Triagens
                    </h3>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {historyLoading ? (
                            <div className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />A carregar histórico...</div>
                        ) : historyError ? (
                            <div className="text-center p-10 text-red-500"><AlertTriangle className="inline-block mr-2" />{historyError}</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {history.length > 0 ? history.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <StatusBadge status={item.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {item.status === 'PENDING' && (
                                                    <button 
                                                        onClick={() => handleResumeScreening(item.id)}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold"
                                                    >
                                                        Continuar Preenchimento
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="text-center p-10 text-gray-500">
                                                Nenhuma triagem encontrada no seu histórico.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && activeScreeningId && (
                <ScreeningModal 
                    screeningId={activeScreeningId} 
                    onClose={handleCloseModal} 
                />
            )}
        </>
    );
}
