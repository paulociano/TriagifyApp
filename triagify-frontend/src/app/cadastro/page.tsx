'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RegistrationPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validações
        if (!fullName || !email || !password || !confirmPassword) {
            toast.error('Por favor, preencha todos os campos.');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    role, // Enviando 'role' em vez de 'userType'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro ao cadastrar.');
            }

            toast.success("Cadastro realizado com sucesso! Por favor, faça login.");
            router.push('/login'); // Redireciona para a página de login

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
                <div>
                    <div className="mx-auto flex justify-center">
                    <Image
                        src="/triagify-logo.svg"
                        alt="Logo Triagify"
                        width={130}
                        height={130}
                        className="w-auto"
                        priority
                    />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Crie a sua conta gratuita
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Já tem uma conta?{' '}
                        <a href="/login" className="font-medium text-[#02bca5] hover:text-[#02bca5]/80">
                            Faça login
                        </a>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Eu sou:
                            </label>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input type="radio" value="PATIENT" checked={role === 'PATIENT'} onChange={(e) => setRole(e.target.value as 'PATIENT' | 'DOCTOR')} className="h-4 w-4 text-[#02bca5] border-gray-300 focus:ring-[#02bca5]" />
                                    <span className="ml-2 text-sm text-gray-700">Paciente</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="DOCTOR" checked={role === 'DOCTOR'} onChange={(e) => setRole(e.target.value as 'PATIENT' | 'DOCTOR')} className="h-4 w-4 text-[#02bca5] border-gray-300 focus:ring-[#02bca5]" />
                                    <span className="ml-2 text-sm text-gray-700">Médico(a)</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <input id="full-name" name="fullName" type="text" required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                        <div>
                            <input id="email-address" name="email" type="email" autoComplete="email" required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" placeholder="Endereço de e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                         <div>
                            <input id="confirm-password" name="confirmPassword" type="password" required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" placeholder="Confirme a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <button type="submit" disabled={isLoading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-[#02bca5] py-3 px-4 text-sm font-medium text-white hover:bg-[#02bca5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02bca5] disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                            {isLoading ? 'Criando conta...' : 'Criar conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
