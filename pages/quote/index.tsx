import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useQuotesStore } from "@/store/quotes";
import { doActionWithLoader } from "@/utils/actions";
import { Quote, Product as QuoteList } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MdAddCircleOutline, MdCopyAll, MdDelete, MdEdit, MdOutlinePictureAsPdf, MdPictureAsPdf } from "react-icons/md";

const QuoteList = () => {

    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const [quotes, setProducts] = useState<Quote[]>([]);
    const { setIsLoading } = useAppStore();
    const { setSelectedQuote } = useQuotesStore();

    const handleEdit = (event: any, _selectedQuote: Partial<QuoteList>) => {
        event.stopPropagation();
        router.push(`/quote/${_selectedQuote.id}`);
    };

    const handleClone = (event: any, _selectedQuote: Partial<QuoteList>) => {
        event.stopPropagation();
        setSelectedQuote(_selectedQuote);
        router.push("/quote/create");
    };

    const handleExportPdf = (event: any, _selectedQuote: Partial<QuoteList>) => {
        event.stopPropagation();
        window.open(`/api/quote/pdf/${_selectedQuote.id}`, "_blank");
    };

    const handleCreateNew = () => {
        router.push("/quote/create");
    };

    const handleDelete = async (event: any, quote: Partial<QuoteList>) => {
        event.stopPropagation();
        await fetch(`/api/quote/${quote.id}`, { method: "DELETE" });
        await fetchQuotes();
    };

    const fetchQuotes = async () => {
        const _quotes = await fetch("/api/quote", { method: "GET" })
            .then((res) => res.json());
        setProducts(_quotes);
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString();
    };

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("quotes")) {
            router.push("/");
        }

        setSelectedQuote(null);
        doActionWithLoader(setIsLoading, fetchQuotes);
    }, [user]);

    return (
        <AppLayout>
            <div className="m-8">
                <table className="items-table">
                    <thead>
                        <tr className="bg-gray-900">
                            <th colSpan={7} className="text-white uppercase p-2 text-lg">{t("quotes.table.title")}</th>
                        </tr>
                        <tr className="bg-gray-700">
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("quotes.table.head.date")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("quotes.table.head.ref")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("quotes.table.head.owner")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map((q: Quote) =>
                            <tr key={q.id} className="table-row" onClick={(event) => handleEdit(event, q)}>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{formatDate(q.updatedAt)}</td>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{q.name}</td>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{q.createdBy}</td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleEdit(event, q)}><div><MdEdit /></div></td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleClone(event, q)}><div><MdCopyAll /></div></td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleExportPdf(event, q)}><div><MdOutlinePictureAsPdf /></div></td>
                                <td className="w-10 cursor-pointer text-red-600" onClick={(event) => handleDelete(event, q)}><MdDelete /></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex item-center justify-center w-full">
                <button
                    className="btn-primary"
                    onClick={handleCreateNew}>
                    <div>
                        <MdAddCircleOutline />
                    </div>
                    <div className="uppercase font-bold text-lg">{t("quotes.button.addQuote")}</div>
                </button>
            </div>
        </AppLayout>
    );
};

export default QuoteList;