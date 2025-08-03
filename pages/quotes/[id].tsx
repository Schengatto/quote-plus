import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useI18nStore } from "@/store/i18n";
import { removeAllPlaceholders } from "@/utils/placeholders";
import { Quote } from "@prisma/client";
import { Parser } from "html-to-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

const QuoteEdit = () => {

    const router = useRouter();
    const params = useParams();
    const user = useAuth();

    const { t } = useI18nStore();
    const targetRef = useRef<HTMLDivElement>(null);

    const [ selectedQuote, setSelectedQuote ] = useState<Quote | null>(null);
    const [ quoteContent, setQuoteContent ] = useState<string>("");
    const [ quoteOverview, setQuoteOverview ] = useState<string>("");

    useEffect(() => {
        setQuoteOverview(() => removeAllPlaceholders(quoteContent));
    }, [ quoteContent ]);

    const handleBack = () => {
        router.push("/quotes");
    };

    const handleExportPdf = async () => {
        window.open(`/api/quotes/pdf/${params.id}`, "_blank");
    };

    const handleEdit = async () => {
        router.push(`/quotes/edit/${params.id}`);
    };

    const fetchSelectedQuote = useCallback(async () => {
        const _quote = await fetch(`/api/quotes/${params.id}`, { method: "GET" }).then((res) => res.json());
        setQuoteContent(_quote.content);
        setSelectedQuote(_quote);
    }, [ params ]);

    useEffect(() => {
        if (!user || !params?.id) return;
        if (!user?.userRole.grants?.includes("quotes")) {
            router.push("/");
            return;
        }
        fetchSelectedQuote();
    }, [ user, router, params, fetchSelectedQuote ]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("quotes.form.pdfPreview")} - {selectedQuote?.name}</span>
                </div>
                <div className="card-body">
                    <div className="w-full">
                        <div className='w-[210mm] my-4 border-2 border-dashed border-black m-auto'>
                            <div className="bg-white max-h-[80vh] overflow-auto" >
                                <div className="p-2" ref={targetRef}>
                                    {Parser().parse(quoteOverview)}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleBack}>
                                <div className="uppercase text-sm">{t("common.back")}</div>
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleExportPdf()}>
                                <div className="uppercase text-sm">{t("quotes.button.exportPdf")}</div>
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleEdit()}>
                                <div className="uppercase text-sm">{t("quotes.button.editQuote")}</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default QuoteEdit;