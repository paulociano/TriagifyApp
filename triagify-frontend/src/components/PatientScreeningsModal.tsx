'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, X} from 'lucide-react';
import toast from 'react-hot-toast';

interface Screening {
    id: string;
    status: string;
    createdAt: string;
}
interface PatientScreeningsModalProps {
  patient: { id: string; fullName: string } | null;
  onClose: () => void;
}

export default function PatientScreeningsModal({ patient, onClose }: PatientScreeningsModalProps) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScreenings = async () => {
    if (!patient) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('triagify-token');
      const res = await fetch(`http://localhost:3001/api/admin/users/${patient.id}/screenings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Falha ao buscar triagens.');
      const data = await res.json();
      setScreenings(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, [patient]);

  const handleDeleteScreening = async (screeningId: string) => {
    if (!window.confirm('Tem a certeza de que deseja apagar esta triagem?')) return;
    try {
        const token = localStorage.getItem('triagify-token');
        const res = await fetch(`http://localhost:3001/api/admin/screenings/${screeningId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Falha ao apagar a triagem.');
        toast.success('Triagem apagada com sucesso.');
        fetchScreenings(); // Atualiza a lista
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro desconhecido.');
    }
  };

  if (!patient) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Triagens de {patient.fullName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-6 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center"><Loader2 className="animate-spin" /></div>
          ) : screenings.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {screenings.map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{s.status}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleDeleteScreening(s.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-4">Nenhuma triagem encontrada para este paciente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
