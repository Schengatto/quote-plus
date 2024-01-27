import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useI18nStore } from "@/store/i18n";
import "@/styles/globals.css";
import { useAppStore } from "@/store/app";
import { doActionWithLoader } from "@/utils/actions";
import Dialog from "@/components/Dialog";

export default function App({ Component, pageProps }: AppProps) {

    const { currentLanguage, setTranslations } = useI18nStore();
    const { isLoading, setIsLoading } = useAppStore();

    useEffect(() => {
        const fetchTranslations = async (locale: string) => {
            const response = await fetch(`/api/translations/${locale}`);
            const _translations = await response.json();
            setTranslations(_translations);
        };

        doActionWithLoader(setIsLoading, () => fetchTranslations(currentLanguage));
    }, [ currentLanguage, setTranslations, setIsLoading ]);

    return <>
        {isLoading
            && <div className="w-full min-h-[100vh] items-center justify-center h-full bg-[#1e6bd769] fixed z-50">
                <div className="mx-[50%] my-[40%] w-full text-white text-2xl uppercase">
                    <h1>Loading ...</h1>
                </div>
            </div>
        }
        <Dialog />
        <Component {...pageProps} />
    </>;
}
