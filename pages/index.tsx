import { useAuth } from "@/hooks/useAuth";
import { useI18nStore } from "@/store/i18n";
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

    const { t } = useI18nStore();

    const [ credentials, setCredentials ] = useState<UserCredentials>({ username: "", password: "" });

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
            const response = await fetch(endpoint, { method: "POST", body: JSON.stringify(credentials) }).then(
                (res) => res.json()
            );

            if (!response.id) {
                throw Error("Utente non trovato");
            }
            router.push("/home");
        } catch (error: any) {
            alert(error.message);
        }
    };

    useEffect(() => {
        if (user) {
            router.push("/home");
        }
    }, [ user ]);

    return (
        <>
            <Head>
                <title>Quote Plus</title>
                <meta
                    name="description"
                    content="Quote Plus"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="w-full min-h-[100vh] flex flex-col gap-2 items-center justify-center h-full bg-gradient-to-r from-cyan-500 to-blue-500">
                <div className="border-4 border-gray-800 text-center">
                    <div className="uppercase font-extrabold p-4 bg-gray-900 text-white text-3xl min-w-[400px]">{t("login.form.title")}</div>
                    <div className="card-body">
                        <form onSubmit={handleLogin}>
                            <div className="uppercase font-bold text-2xl my-3">
                                <div>{t("login.form.username")}</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleUsernameChanged} />
                            </div>
                            <div className="uppercase font-bold text-2xl my-3">
                                <div>{t("login.form.password")}</div>
                                <input
                                    type="password"
                                    required
                                    className="text-input"
                                    onChange={handlePasswordChanged} />
                            </div>
                            <div className="flex items-center justify-center mt-5">
                                <button type="submit"
                                    className="btn-primary">
                                    <span className="uppercase font-bold text-lg">{t("login.form.loginBtn")}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
};

export default LoginPage;