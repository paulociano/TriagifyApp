'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Link2, Trash2, Send, Search, User, UserCheck, UserPlus, XCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';

// Tipos
interface Doctor {
    id: string;
    fullName: string;
}
interface Patient {
    id: string;
    fullName: string;
    email: string;
}
interface Screening {
    id: string;
    status: string;
    createdAt: string;
    doctor: { fullName: string } | null;
}
interface PatientDetails extends Patient {
    associatedDoctors: Doctor[];
    screenings: Screening[];
}

// Componente principal da página
export default function AdminPage() {
    const [patientSearch, setPatientSearch] = useState('');
    const [debouncedPatientSearch] = useDebounce(patientSearch, 500);
    const [searchedPatients, setSearchedPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
    
    const [doctorSearch, setDoctorSearch] = useState('');
    const [debouncedDoctorSearch] = useDebounce(doctorSearch, 500);
    const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'associations' | 'screenings'>('associations');

    // Busca pacientes com base na pesquisa do admin
    useEffect(() => {
        const fetchSearchedPatients = async () => {
            if (debouncedPatientSearch.length < 2) {
                setSearchedPatients([]);
                return;
            }
            setIsLoading(true);
            try {
                const token = localStorage.getItem('triagify-token');
                const res = await fetch(`http://localhost:3001/api/admin/users?role=PATIENT&search=${debouncedPatientSearch}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Falha ao buscar pacientes.');
                const data = await res.json();
                setSearchedPatients(data);
            } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro desconhecido'); }
            finally { setIsLoading(false); }
        };
        fetchSearchedPatients();
    }, [debouncedPatientSearch]);

    // Busca médicos disponíveis com base na pesquisa
    useEffect(() => {
        const fetchAvailableDoctors = async () => {
            try {
                const token = localStorage.getItem('triagify-token');
                if (!token) throw new Error("Token não encontrado.");
                const res = await fetch(`http://localhost:3001/api/admin/users?role=DOCTOR&search=${debouncedDoctorSearch}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Falha ao buscar médicos.');
                const data = await res.json();
                setAvailableDoctors(data);
            } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro desconhecido'); }
        };
        fetchAvailableDoctors();
    }, [debouncedDoctorSearch]);

    const handleSelectPatient = useCallback(async (patientId: string) => {
        setIsLoading(true);
        setSearchedPatients([]);
        setPatientSearch('');
        try {
            const token = localStorage.getItem('triagify-token');
            const res = await fetch(`http://localhost:3001/api/admin/patients/${patientId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Falha ao buscar detalhes do paciente.');
            const data = await res.json();
            setSelectedPatient(data);
        } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro desconhecido'); }
        finally { setIsLoading(false); }
    }, []);

    const handleAction = async (action: 'associate' | 'disassociate' | 'create-screening', doctorId: string, patientId: string) => {
        setIsActionLoading(`${action}-${doctorId}`);
        const endpoints = { associate: 'associate', disassociate: 'disassociate', 'create-screening': 'create-screening' };
        try {
            const token = localStorage.getItem('triagify-token');
            const res = await fetch(`http://localhost:3001/api/admin/${endpoints[action]}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId, patientId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success(data.message);
            await handleSelectPatient(patientId);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao executar ação.');
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Tem a certeza? Apagar um utilizador é uma ação irreversível.')) return;
        setIsActionLoading(`delete-user-${userId}`);
        try {
            const token = localStorage.getItem('triagify-token');
            const res = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Falha ao apagar o utilizador.');
            toast.success('Utilizador apagado com sucesso.');
            setSelectedPatient(null); // Limpa a seleção
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro desconhecido.');
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleDeleteScreening = async (screeningId: string) => {
        if (!window.confirm('Tem a certeza de que deseja apagar esta triagem?')) return;
        setIsActionLoading(`delete-screening-${screeningId}`);
        try {
            const token = localStorage.getItem('triagify-token');
            const res = await fetch(`http://localhost:3001/api/admin/screenings/${screeningId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Falha ao apagar a triagem.');
            toast.success('Triagem apagada com sucesso.');
            if (selectedPatient) {
                await handleSelectPatient(selectedPatient.id);
            }
        } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro desconhecido.'); }
        finally { setIsActionLoading(null); }
    };

    const doctorsToAssociate = availableDoctors.filter(doc => !selectedPatient?.associatedDoctors.some(assocDoc => assocDoc.id === doc.id));

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Utilizadores e Relações</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">1. Selecione um Paciente</h2>
                <div className="relative">
                    <input type="text" placeholder="Digite o nome ou e-mail do paciente..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                {searchedPatients.length > 0 && (
                    <ul className="border rounded-lg mt-2 max-h-60 overflow-y-auto">{searchedPatients.map(p => (
                        <li key={p.id} onClick={() => handleSelectPatient(p.id)} className="p-3 hover:bg-gray-100 cursor-pointer border-b">{p.fullName} <span className="text-gray-500 text-sm ml-2">{p.email}</span></li>
                    ))}</ul>
                )}
            </div>

            {isLoading && <div className="text-center p-8"><Loader2 className="animate-spin" /></div>}

            {selectedPatient && !isLoading && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">A gerir: <span className="text-blue-600">{selectedPatient.fullName}</span></h2>
                            <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => handleDeleteUser(selectedPatient.id)} disabled={!!isActionLoading} className="flex items-center text-sm text-red-600 hover:text-red-800"><Trash2 size={16} className="mr-1" /> Apagar Utilizador</button>
                            <button onClick={() => setSelectedPatient(null)} className="flex items-center text-sm text-gray-600 hover:text-gray-800"><XCircle size={16} className="mr-1" /> Limpar Seleção</button>
                        </div>
                    </div>
                    
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('associations')} className={`${activeTab === 'associations' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium`}>Gestão de Relações</button>
                            <button onClick={() => setActiveTab('screenings')} className={`${activeTab === 'screenings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium`}>Gestão de Triagens ({selectedPatient.screenings?.length || 0})</button>
                        </nav>
                    </div>

                    {activeTab === 'associations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4 flex items-center"><UserCheck size={20} className="mr-2 text-green-600" /> Médicos Associados</h3>
                                <div className="space-y-3">
                                    {selectedPatient.associatedDoctors.length > 0 ? selectedPatient.associatedDoctors.map(doc => (
                                        <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                                            <p className="font-medium">{doc.fullName}</p>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleAction('create-screening', doc.id, selectedPatient.id)} disabled={!!isActionLoading} className="p-2 text-gray-500 hover:text-green-600" title="Criar e Notificar Triagem">{isActionLoading === `create-screening-${doc.id}` ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
                                                <button onClick={() => handleAction('disassociate', doc.id, selectedPatient.id)} disabled={!!isActionLoading} className="p-2 text-gray-500 hover:text-red-600" title="Desassociar">{isActionLoading === `disassociate-${doc.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                                            </div>
                                        </div>
                                    )) : <p className="text-gray-500 text-center py-4">Nenhum médico associado.</p>}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold mb-4 flex items-center"><UserPlus size={20} className="mr-2 text-blue-600" /> Associar Novos Médicos</h3>
                                <div className="relative mb-4">
                                    <input type="text" placeholder="Procurar médicos..." value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>
                                <div className="space-y-3 max-h-72 overflow-y-auto">
                                    {doctorsToAssociate.length > 0 ? doctorsToAssociate.map(doc => (
                                        <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                                            <p className="font-medium">{doc.fullName}</p>
                                            <button onClick={() => handleAction('associate', doc.id, selectedPatient.id)} disabled={!!isActionLoading} className="p-2 text-gray-500 hover:text-blue-600" title="Associar">{isActionLoading === `associate-${doc.id}` ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}</button>
                                        </div>
                                    )) : <p className="text-gray-500 text-center py-4">Nenhum médico encontrado ou todos já estão associados.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'screenings' && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 flex items-center"><FileText size={20} className="mr-2 text-gray-600" /> Triagens do Paciente</h3>
                            <div className="space-y-3">
                                {selectedPatient.screenings && selectedPatient.screenings.length > 0 ? selectedPatient.screenings.map(s => (
                                    <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                                        <div>
                                            <p><strong>Médico:</strong> {s.doctor?.fullName || 'N/A'}</p>
                                            <p className="text-sm text-gray-600"><strong>Data:</strong> {new Date(s.createdAt).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-600"><strong>Status:</strong> <span className="font-semibold">{s.status}</span></p>
                                        </div>
                                        <button onClick={() => handleDeleteScreening(s.id)} disabled={!!isActionLoading} className="p-2 text-gray-500 hover:text-red-600" title="Apagar Triagem">{isActionLoading === `delete-screening-${s.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                                    </div>
                                )) : <p className="text-gray-500 text-center py-4">Nenhuma triagem encontrada para este paciente.</p>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
