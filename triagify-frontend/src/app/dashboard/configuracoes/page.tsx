'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, KeyRound, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import EditQuestionModal from '@/components/EditQuestionModal'; // Importa o modal de edição

// Tipos para os dados
interface Question {
  id: string;
  text: string;
  category: string;
  type: 'YES_NO' | 'OPEN_TEXT' | 'MULTIPLE_CHOICE';
  options: string[];
  creatorId: string | null;
}

// Componente para o formulário de perfil
function ProfileForm() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('triagify-token');
            const res = await fetch('http://localhost:3001/api/profile/me', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setFullName(data.fullName);
                setEmail(data.email);
                setSpecialty(data.specialty || '');
            }
            setIsLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('triagify-token');
        const res = await fetch('http://localhost:3001/api/profile/me', {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, specialty }),
        });
        const data = await res.json();
        toast[res.ok ? 'success' : 'error'](data.message);
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">E-mail (não pode ser alterado)</label>
                <input type="email" value={email} disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div className="flex items-center justify-end">
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                    Salvar Alterações
                </button>
            </div>
        </form>
    );
}

// Componente para o formulário de senha
function PasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setIsSubmitting(true);
        const token = localStorage.getItem('triagify-token');
        const res = await fetch('http://localhost:3001/api/profile/change-password', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        toast[res.ok ? 'success' : 'error'](data.message);
        if (res.ok) {
            setCurrentPassword('');
            setNewPassword('');
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Senha Atual</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            </div>
            <div className="flex items-center justify-end">
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <KeyRound size={16} className="mr-2" />}
                    Alterar Senha
                </button>
            </div>
        </form>
    );
}

// Componente para gerir as perguntas
function QuestionsManager() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionCategory, setNewQuestionCategory] = useState('Sintomas');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('triagify-token');
            const res = await fetch('http://localhost:3001/api/questions', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Falha ao buscar as perguntas.');
            const data = await res.json();
            setQuestions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleCreateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('triagify-token');
            const res = await fetch('http://localhost:3001/api/questions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newQuestionText, category: newQuestionCategory, type: 'OPEN_TEXT', options: [] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success('Pergunta criada com sucesso!');
            setNewQuestionText('');
            fetchQuestions();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao criar pergunta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!window.confirm('Tem a certeza de que deseja apagar esta pergunta?')) return;
        try {
            const token = localStorage.getItem('triagify-token');
            const res = await fetch(`http://localhost:3001/api/questions/${questionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Falha ao apagar a pergunta.');
            toast.success('Pergunta apagada com sucesso!');
            fetchQuestions();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao apagar pergunta.');
        }
    };

    const handleOpenEditModal = (question: Question) => {
        setSelectedQuestion(question);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setSelectedQuestion(null);
        setIsEditModalOpen(false);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Gerir Perguntas do Questionário</h2>
                <form onSubmit={handleCreateQuestion} className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold mb-2">Adicionar Nova Pergunta</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Texto da pergunta..." value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} required className="md:col-span-2 block w-full rounded-md border-gray-300 shadow-sm" />
                        <select value={newQuestionCategory} onChange={(e) => setNewQuestionCategory(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm">
                            <option>Sintomas</option>
                            <option>Hábitos</option>
                            <option>Histórico Médico</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="mt-3 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                        Adicionar Pergunta
                    </button>
                </form>
                <div className="space-y-3">
                    {isLoading ? (<div className="text-center p-4"><Loader2 className="animate-spin" /></div>) : error ? (<div className="text-center p-4 text-red-500"><AlertTriangle className="inline-block mr-2" />{error}</div>) : (
                        questions.map(q => (
                            <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                                <div>
                                    <p className="font-medium text-gray-800">{q.text}</p>
                                    <p className="text-sm text-gray-500">{q.category}</p>
                                </div>
                                <div>
                                    {q.creatorId ? (
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleOpenEditModal(q)} className="p-2 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">Padrão</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {isEditModalOpen && (
                <EditQuestionModal 
                    question={selectedQuestion}
                    onClose={handleCloseEditModal}
                    onSave={() => {
                        fetchQuestions();
                    }}
                />
            )}
        </>
    );
}

// Componente principal da página
export default function SettingsPage() {
  return (
    <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Configurações da Conta</h1>
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Editar Perfil</h2>
                <ProfileForm />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Alterar Senha</h2>
                <PasswordForm />
            </div>
            <QuestionsManager />
        </div>
    </div>
  );
}
