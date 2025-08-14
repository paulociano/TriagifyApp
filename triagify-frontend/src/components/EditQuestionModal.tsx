// Ficheiro: frontend/src/components/EditQuestionModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Tipos para os dados
interface Question {
  id: string;
  text: string;
  category: string;
}
interface EditQuestionModalProps {
  question: Question | null;
  onClose: () => void;
  onSave: () => void;
}

export default function EditQuestionModal({ question, onClose, onSave }: EditQuestionModalProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Sintomas');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (question) {
      setText(question.text);
      setCategory(question.category);
    }
  }, [question]);

  if (!question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('triagify-token');
      const res = await fetch(`http://localhost:3001/api/questions/${question.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Pergunta atualizada com sucesso!');
      onSave(); // Avisa o componente pai para recarregar a lista
      onClose(); // Fecha o modal

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar pergunta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Editar Pergunta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Texto da Pergunta</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option>Sintomas</option>
                <option>Hábitos</option>
                <option>Histórico Médico</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 text-right">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}