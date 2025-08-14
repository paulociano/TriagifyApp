// Ficheiro: frontend/src/app/reset-password/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Loader2, KeyRound } from 'lucide-react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState<string | null>(null);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro.');
            }
            
            toast.success('Senha redefinida com sucesso! Pode fazer login com a sua nova senha.');
            router.push('/login');

        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return <div className="text-center text-red-500">Token de redefinição inválido ou em falta.</div>;
    }

    return (
        <div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
                Crie uma Nova Senha
            </h2>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="new-password" className="sr-only">Nova Senha</label>
                    <input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        required
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3"
                        placeholder="Nova Senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                 <div>
                    <label htmlFor="confirm-password" className="sr-only">Confirme a Nova Senha</label>
                    <input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        required
                        className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3"
                        placeholder="Confirme a Nova Senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <div>
                    <button type="submit" disabled={isLoading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-3 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400">
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : <KeyRound className="mr-2 h-5 w-5" />}
                        Redefinir Senha
                    </button>
                </div>
            </form>
        </div>
    );
}

// Componente principal que envolve o formulário com Suspense
export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
                <div className="mx-auto flex justify-center">
                    <Image src="/logo-triagify.svg" alt="Logo Triagify" width={64} height={64} className="h-16 w-auto" />
                </div>
                <Suspense fallback={<div className="text-center"><Loader2 className="animate-spin" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
