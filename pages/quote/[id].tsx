import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useI18nStore } from "@/store/i18n";
import { Quote } from "@prisma/client";
import { Parser } from "html-to-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

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
        setQuoteOverview(() => quoteContent.replaceAll("{{prodotti}}", ""));
    }, [ quoteContent ]);

    const handleBack = () => {
        router.push("/quote");
    };

    const handleExportPdf = async () => {
        window.open(`/api/quote/pdf/${params.id}`, "_blank");
    };

    const handleEdit = async () => {
        router.push(`/quote/edit/${params.id}`);
    };

    const fetchSelectedQuote = async () => {
        const _quote = await fetch(`/api/quote/${params.id}`, { method: "GET" }).then((res) => res.json());
        setQuoteContent(_quote.content);
        setSelectedQuote(_quote);
    };

    useEffect(() => {
        if (!user || !params?.id) return;
        if (!user?.userRole.grants?.includes("quotes")) {
            router.push("/");
            return;
        }
        fetchSelectedQuote();
    }, [ params ]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">{t("quotes.form.pdfPreview")} - {selectedQuote?.name}</div>
                <div className="card-body">
                    <div className="w-[90%]">
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
                                <div className="uppercase font-bold text-lg">{t("common.back")}</div>
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleExportPdf()}>
                                <div className="uppercase font-bold text-lg">{t("quotes.button.exportPdf")}</div>
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleEdit()}>
                                <div className="uppercase font-bold text-lg">{t("quotes.button.editQuote")}</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default QuoteEdit;