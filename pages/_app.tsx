import Dialog from "@/components/Dialog";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import "@/styles/globals.css";
import { doActionWithLoader } from "@/utils/actions";
import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {

    const { currentLanguage, setTranslations } = useI18nStore();
    const { isLoading, setIsLoading } = useAppStore();

    useEffect(() => {
        if (!currentLanguage) return;
        const fetchTranslations = async (locale: string) => {
            const response = await fetch(`/api/translations/${locale}`);
            const _translations = await response.json();
            setTranslations(_translations);
        };

        doActionWithLoader(setIsLoading, () => fetchTranslations(currentLanguage));
    }, [currentLanguage, setTranslations, setIsLoading]);

    return <>
        {isLoading &&
            <>
                <LoadingIndicator />
                <div className="w-full min-h-[100vh] items-center justify-center h-full bg-[#99b5dd69] fixed z-50">
                    <div className="mx-[50%] h-full my-[20%] w-full text-black text-2xl uppercase flex gap-5 font-bold">
                        <h1>Loading ...</h1>
                    </div>
                </div>
            </>
        }
        <Dialog />
        <Component {...pageProps} />
    </>;
}
