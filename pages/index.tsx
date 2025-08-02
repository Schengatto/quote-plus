import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { errorDialog } from "@/utils/dialog";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

interface UserCredentials {
    username: string;
    password: string;
}

const LoginPage = () => {
    const router = useRouter();
    const user = useAuth();

    const { t, setCurrentLanguage } = useI18nStore();
    const { setDialog } = useAppStore();

    const [credentials, setCredentials] = useState<UserCredentials>({ username: "", password: "" });

    const handleUsernameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setCredentials((prev) => ({ ...prev, username: e.target.value }));
    };

    const handlePasswordChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setCredentials((prev) => ({ ...prev, password: e.target.value }));
    };

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const endpoint = "/api/users/auth";
            const response = await fetch(endpoint, { method: "POST", body: JSON.stringify(credentials) }).then((res) =>
                res.json()
            );

            if (!response.id) {
                throw Error("Utente non trovato");
            }
            const userLanguage = (response?.extraData as any).language || "en";
            localStorage.setItem("userLanguage", userLanguage);
            setCurrentLanguage(userLanguage);
            router.push("/home");
        } catch (error: any) {
            errorDialog(t, "common.error.userNotFound").then((content) => setDialog(content));
        }
    };

    useEffect(() => {
        if (user) {
            router.push("/home");
        } else {
            setCurrentLanguage(navigator?.language?.split("-")[0] ?? "en");
        }
    }, [user, router, setCurrentLanguage]);

    return (
        <>
            <Head>
                <title>Quote Plus</title>
                <meta name='description' content='Quote Plus' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='icon' href='/favicon.ico' />
            </Head>
            <main className='w-full min-h-screen flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 px-4'>
                <div className='bg-white shadow-lg rounded-2xl w-full max-w-md p-8'>
                    <h2 className='uppercase text-2xl font-semibold text-center text-gray-800 mb-6'>
                        {t("login.form.title")}
                    </h2>
                    <form onSubmit={handleLogin} className='space-y-6'>
                        <div>
                            <label htmlFor='username' className='first-letter:uppercase block text-sm font-medium text-gray-700'>
                                {t("login.form.username")}
                            </label>
                            <input
                                type='text'
                                id='username'
                                required
                                onChange={handleUsernameChanged}
                                className='mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        <div>
                            <label htmlFor='password' className='first-letter:uppercase block text-sm font-medium text-gray-700'>
                                {t("login.form.password")}
                            </label>
                            <input
                                type='password'
                                id='password'
                                required
                                onChange={handlePasswordChanged}
                                className='mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        <div>
                            <button
                                type='submit'
                                className='uppercase w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200'
                            >
                                {t("login.form.loginBtn")}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
};

export default LoginPage;
