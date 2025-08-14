'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, User, Mail, ArrowLeft, CheckCircle, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';

// Interfaces para tipagem dos dados
interface Answer {
  value: string;
  question: {
    text: string;
    category: string;
  };
}

interface ExamFile {
  id: string;
  originalName: string;
  filePath: string;
}

interface ScreeningDetails {
  id: string;
  status: string;
  doctorNotes: string | null;
  patient: {
    fullName: string;
    email: string;
  };
  answers: Answer[];
  examFiles: ExamFile[];
}

export default function ScreeningAnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const screeningId = params.id as string;

  const [screening, setScreening] = useState<ScreeningDetails | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!screeningId) return;

    const fetchScreeningDetails = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('triagify-token');
        if (!token) throw new Error('Utilizador não autenticado.');

        const response = await fetch(`http://localhost:3001/api/screenings/${screeningId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            if (response.status === 404) throw new Error('Triagem não encontrada.');
            throw new Error('Falha ao buscar detalhes da triagem.');
        }
        
        const data = await response.json();
        setScreening(data);
        setDoctorNotes(data.doctorNotes || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScreeningDetails();
  }, [screeningId]);
  
  const handleReviewSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('triagify-token');
      if (!token) throw new Error('Utilizador não autenticado.');

      const response = await fetch(`http://localhost:3001/api/screenings/${screeningId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doctorNotes }),
      });

      if (!response.ok) throw new Error('Falha ao salvar a análise.');

      toast.success('Análise salva com sucesso!');
      router.push('/dashboard');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedAnswers = screening?.answers.reduce((acc, answer) => {
    const category = answer.question.category;
    acc[category] = acc[category] || [];
    acc[category].push(answer);
    return acc;
  }, {} as Record<string, Answer[]>);

  if (isLoading) {
    return <div className="text-center p-10"><Loader2 className="animate-spin inline-block mr-2" />A carregar detalhes da triagem...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500"><AlertTriangle className="inline-block mr-2" />Erro: {error}</div>;
  }

  if (!screening) {
    return <div className="text-center p-10 text-gray-500">Nenhum dado encontrado para esta triagem.</div>;
  }

  return (
    <div>
      <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 font-medium"
      >
          <ArrowLeft size={20} className="mr-2" />
          Voltar para o Dashboard
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Análise de Triagem</h1>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-8 flex items-center">
            <User size={24} className="text-blue-600 mr-4" />
            <div>
                <p className="font-bold text-lg text-gray-800">{screening.patient.fullName}</p>
                <p className="text-sm text-gray-600">{screening.patient.email}</p>
            </div>
        </div>

        {groupedAnswers && Object.entries(groupedAnswers).map(([category, answers]) => (
            <div key={category} className="mb-8">
                <h2 className="text-2xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2 mb-6">{category}</h2>
                <dl>
                    {answers.map((answer, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                            <dt className="text-md font-semibold text-gray-700 mb-1">{answer.question.text}</dt>
                            <dd className="text-gray-900 pl-4 border-l-2 border-gray-300">{answer.value || <span className="text-gray-400 italic">Não respondido</span>}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        ))}

        {screening.examFiles.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2 mb-6">Exames Anexados</h2>
            <ul className="space-y-3">
              {screening.examFiles.map(file => (
                <li key={file.id}>
                  <a 
                    href={`http://localhost:3001/${file.filePath}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Paperclip size={18} className="text-gray-600 mr-3" />
                    <span className="font-medium text-blue-700">{file.originalName}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-gray-200 mt-8 pt-6">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Notas do Médico</h2>
            <textarea
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Adicione as suas notas privadas sobre esta triagem..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                disabled={screening.status === 'REVIEWED'}
            />
            
            {screening.status !== 'REVIEWED' ? (
                <div className="mt-6 text-right">
                    <button
                        onClick={handleReviewSubmit}
                        disabled={isSubmitting}
                        className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg flex items-center ml-auto hover:bg-green-700 disabled:bg-green-400"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                        Marcar como Analisada e Salvar Notas
                    </button>
                </div>
            ) : (
                <div className="mt-6 p-4 bg-green-50 text-green-800 rounded-md flex items-center">
                    <CheckCircle className="mr-3" />
                    <p className="font-semibold">Esta triagem já foi analisada.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
