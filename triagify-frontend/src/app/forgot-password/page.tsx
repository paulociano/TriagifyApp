// Ficheiro: frontend/src/app/forgot-password/page.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro.');
            }
            
            setMessageSent(true); // Mostra a mensagem de sucesso

        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
                <div className="mx-auto flex justify-center">
                    <Image src="/logo-triagify.svg" alt="Logo Triagify" width={64} height={64} className="h-16 w-auto" />
                </div>
                
                {messageSent ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Verifique o seu Email</h2>
                        <p className="mt-4 text-gray-600">
                            Se um utilizador com este email existir na nossa base de dados, um link para redefinir a sua senha foi enviado.
                        </p>
                        <Link href="/login" className="mt-6 inline-block text-blue-600 hover:text-blue-800 font-semibold">
                            Voltar para o Login
                        </Link>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
                            Recuperar Senha
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Insira o seu email e enviaremos um link para redefinir a sua senha.
                        </p>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email-address" className="sr-only">Endereço de e-mail</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                    placeholder="Endereço de e-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-3 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400">
                                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2 h-5 w-5" />}
                                    Enviar Link de Recuperação
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
