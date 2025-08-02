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
                <div className="fixed inset-0 flex items-end justify-center bg-white z-40 bg-opacity-80">
                    <div className="mb-10 text-xl font-semibold text-gray-600 animate-pulse">
                        Loading...
                    </div>
                </div>
            </>
        }
        <Dialog />
        <Component {...pageProps} />
    </>;
}
