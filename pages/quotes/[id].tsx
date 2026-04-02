import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useI18nStore } from "@/store/i18n";
import { removeAllPlaceholders } from "@/utils/placeholders";
import { Quote } from "@prisma/client";
import { Parser } from "html-to-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";

const QuotePreview = () => {

    const router = useRouter();
    const params = useParams();
    const { userData: user } = useAuth();

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

    const handlePrint = () => {
        if (!targetRef.current) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>${selectedQuote?.name || ""}</title>
                <style>
                    @page { size: A4; margin: 10mm 12mm; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; margin: 0; padding: 16px; }
                    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
                    td, th { padding: 8px 10px; vertical-align: top; }
                    img { max-width: 180px; height: auto; }
                    p { margin: 6px 0; }
                    strong { color: #1e293b; }
                </style>
            </head>
            <body>${targetRef.current.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
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

    useEffect(() => {
        if (selectedQuote && router.query.print === "true") {
            const timer = setTimeout(() => handlePrint(), 500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ selectedQuote, router.query.print ]);

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
                                    {quoteOverview ? Parser().parse(quoteOverview) : null}
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
                                onClick={handlePrint}>
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

export default QuotePreview;
