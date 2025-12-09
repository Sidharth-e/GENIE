"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function LoginContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleLogin = async (provider: "google" | "azure-ad") => {
        setIsLoading(provider);
        await signIn(provider, { callbackUrl });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg md:p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to your account to continue
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={() => handleLogin("google")}
                        disabled={!!isLoading}
                        className="flex w-full items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                        {isLoading === "google" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                        )}
                        Sign in with Google
                    </button>

                    <button
                        onClick={() => handleLogin("azure-ad")}
                        disabled={!!isLoading}
                        className="flex w-full items-center justify-center rounded-md border border-transparent bg-[#2F2F2F] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#2F2F2F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                        {isLoading === "azure-ad" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="microsoft" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                <path fill="currentColor" d="M0 32h214.6v214.6H0V32zm233.4 0H448v214.6H233.4V32zM0 265.4h214.6V480H0V265.4zm233.4 0H448V480H233.4V265.4z"></path>
                            </svg>
                        )}
                        Sign in with Microsoft
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
