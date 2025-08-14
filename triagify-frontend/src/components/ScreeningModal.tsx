'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send, AlertTriangle, Upload, File, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Tipos para os dados
interface Question {
  id: string;
  text: string;
  category: string;
  type: 'YES_NO' | 'OPEN_TEXT' | 'MULTIPLE_CHOICE';
  options: string[];
}
interface Answers {
  [key: string]: string;
}
interface ScreeningModalProps {
  screeningId: string;
  onClose: () => void;
}

export default function ScreeningModal({ screeningId, onClose }: ScreeningModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!screeningId) return;

    const fetchScreeningData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('triagify-token');
        if (!token) throw new Error('Utilizador não autenticado.');

        const [questionsRes, detailsRes] = await Promise.all([
          fetch('http://localhost:3001/api/screening/questions', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`http://localhost:3001/api/screening/${screeningId}/details`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!questionsRes.ok) throw new Error('Falha ao buscar as perguntas.');
        if (!detailsRes.ok) throw new Error('Falha ao buscar os detalhes da triagem.');

        const questionsData = await questionsRes.json();
        const detailsData = await detailsRes.json();

        setQuestions(questionsData);

        if (detailsData.answers) {
          const savedAnswers = detailsData.answers.reduce((acc, ans) => {
            acc[ans.questionId] = ans.value;
            return acc;
          }, {});
          setAnswers(savedAnswers);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar dados.');
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScreeningData();
  }, [screeningId]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('triagify-token');
      if (!token) throw new Error('Utilizador não autenticado.');

      if (selectedFiles.length > 0) {
        setIsUploading(true);
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('examFile', file);
          const uploadResponse = await fetch(`http://localhost:3001/api/screenings/${screeningId}/upload-exam`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });
          if (!uploadResponse.ok) throw new Error(`Falha ao enviar o ficheiro: ${file.name}`);
        }
        setIsUploading(false);
      }

      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      const answersResponse = await fetch(`http://localhost:3001/api/screening/${screeningId}/answers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      });
      if (!answersResponse.ok) throw new Error('Falha ao enviar as respostas.');

      toast.success('Triagem e exames enviados com sucesso!');
      onClose();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      setError(errorMessage);
      setIsUploading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedQuestions = questions.reduce((acc, q) => {
    const category = q.category || 'Outros';
    acc[category] = acc[category] || [];
    acc[category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Formulário de Pré-Consulta</h1>
            <p className="text-gray-600">Por favor, responda às perguntas abaixo com atenção.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={28} />
          </button>
        </div>

        <div className="overflow-y-auto p-8">
          {isLoading ? (
             <div className="text-center p-10 flex items-center justify-center"><Loader2 className="animate-spin inline-block mr-3" />A carregar formulário...</div>
          ) : error ? (
             <div className="text-center p-10 text-red-500"><AlertTriangle className="inline-block mr-2" />Erro: {error}</div>
          ) : (
            <form onSubmit={handleSubmit}>
              {Object.entries(groupedQuestions).map(([category, qs]) => (
                <div key={category} className="mb-10">
                  <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2 mb-6">{category}</h2>
                  {qs.map((q) => (
                    <div key={q.id} className="mb-6">
                      <label className="block text-md font-medium text-gray-700 mb-3">{q.text}</label>
                      {q.type === 'OPEN_TEXT' && (<textarea rows={3} className="w-full p-2 border border-gray-300 rounded-md" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} />)}
                      {q.type === 'YES_NO' && (<div className="flex space-x-4"><label className="flex items-center"><input type="radio" name={q.id} value="Sim" checked={answers[q.id] === 'Sim'} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="mr-2 h-4 w-4" /> Sim</label><label className="flex items-center"><input type="radio" name={q.id} value="Não" checked={answers[q.id] === 'Não'} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="mr-2 h-4 w-4" /> Não</label></div>)}
                      {q.type === 'MULTIPLE_CHOICE' && (<div className="flex flex-col space-y-2">{q.options.map(opt => (<label key={opt} className="flex items-center"><input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="mr-2 h-4 w-4" /> {opt}</label>))}</div>)}
                    </div>
                  ))}
                </div>
              ))}
              
              <div className="mb-10">
                <h2 className="text-xl font-semibold text-blue-600 border-b-2 border-blue-200 pb-2 mb-6">Anexar Exames</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"><Upload className="mx-auto h-12 w-12 text-gray-400" /><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} /><span>Selecione os seus ficheiros</span></label><p className="text-xs text-gray-500">PDF, PNG, JPG até 10MB</p></div>
                {selectedFiles.length > 0 && (<div className="mt-4"><h3 className="font-semibold">Ficheiros selecionados:</h3><ul className="mt-2 space-y-2">{selectedFiles.map((file, index) => (<li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md"><div className="flex items-center min-w-0"><File className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" /><span className="text-sm truncate">{file.name}</span></div><button onClick={() => removeFile(file)} className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"><X className="h-5 w-5" /></button></li>))}</ul></div>)}
              </div>

              <div className="mt-10 text-right sticky bottom-0 bg-white py-4 -mx-8 px-8 border-t">
                  <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg flex items-center ml-auto hover:bg-blue-700 disabled:bg-blue-300">
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                      {isUploading ? 'A enviar ficheiros...' : isSubmitting ? 'A enviar respostas...' : 'Enviar Triagem e Exames'}
                  </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
