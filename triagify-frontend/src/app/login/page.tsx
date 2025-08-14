'use client'; 

import React, { useState } from 'react';
import Image from 'next/image';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import toast from 'react-hot-toast';

// Define o tipo personalizado para o nosso token JWT
interface CustomJwtPayload extends JwtPayload {
    userId: string;
    email: string;
    role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    fullName: string;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ocorreu um erro ao fazer login.');
            }

            localStorage.setItem('triagify-token', data.token);
            toast.success('Login bem-sucedido!');

            const decodedToken = jwtDecode<CustomJwtPayload>(data.token);
            
            // Lógica de redirecionamento baseada no perfil do utilizador
            if (decodedToken.role === 'ADMIN') {
                window.location.href = '/admin';
            } else if (decodedToken.role === 'DOCTOR') {
                window.location.href = '/dashboard';
            } else if (decodedToken.role === 'PATIENT') {
                window.location.href = '/patient-dashboard';
            } else {
                throw new Error('Perfil de utilizador desconhecido.');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
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
                    <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-gray-900">
                        Acesse a sua conta
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Ou{' '}
                        <a href="/cadastro" className="font-medium text-[#02bca5] hover:text-[#02bca5]/80">
                            crie uma conta gratuitamente
                        </a>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <input id="email-address" name="email" type="email" autoComplete="email" required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" placeholder="Endereço de e-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" autoComplete="current-password" required className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm font-medium text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <a href="/forgot-password" className="font-medium text-[#02bca5] hover:text-[#02bca5]/80">
                                Esqueceu a sua senha?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button type="submit" disabled={isLoading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-[#02bca5] py-3 px-4 text-sm font-medium text-white hover:bg-[#02bca5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02bca5] disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
