'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, User, Edit } from 'lucide-react';

export default function PatientProfilePage() {
    const params = useParams(); // Hook para pegar parâmetros da URL, como o ID
    const router = useRouter(); // Hook para navegação
    const { id } = params;

    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return; // Não faz nada se o ID ainda não estiver disponível

        const fetchPatientDetails = async () => {
            try {
                const token = localStorage.getItem('triagify-token');
                if (!token) throw new Error('Token não encontrado.');

                const response = await fetch(`http://localhost:3001/api/patients/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 404) throw new Error('Paciente não encontrado.');
                    throw new Error('Falha ao buscar dados do paciente.');
                }

                const data = await response.json();
                setPatient(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatientDetails();
    }, [id]); // O useEffect é re-executado se o ID mudar

    if (isLoading) {
        return <div className="text-center p-10">A carregar perfil do paciente...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Erro: {error}</div>;
    }

    if (!patient) {
        return <div className="text-center p-10 text-gray-500">Nenhum dado de paciente para exibir.</div>;
    }

    return (
        <div>
            <button 
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
            >
                <ArrowLeft size={20} className="mr-2" />
                Voltar para a lista de pacientes
            </button>

            <div className="bg-white rounded-lg shadow-md p-8">
                {/* Cabeçalho do Perfil */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mr-6">
                            <User size={40} className="text-[#02bca5]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{patient.fullName}</h1>
                            <div className="flex items-center text-gray-500 mt-1">
                                <Mail size={16} className="mr-2" />
                                <span>{patient.email}</span>
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">
                        <Edit size={16} className="mr-2" />
                        Editar
                    </button>
                </div>

                {/* Informações Adicionais */}
                <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Detalhes do Cadastro</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                            <Calendar size={20} className="text-gray-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Data de Cadastro</p>
                                <p className="font-medium text-gray-800">{new Date(patient.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                         <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                            <Calendar size={20} className="text-gray-500 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Última Atualização</p>
                                <p className="font-medium text-gray-800">{new Date(patient.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Histórico de Triagens (Placeholder) */}
                <div className="border-t border-gray-200 mt-8 pt-6">
                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Histórico de Triagens</h2>
                     <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                        <p>O histórico de triagens aparecerá aqui.</p>
                     </div>
                </div>
            </div>
        </div>
    );
}
