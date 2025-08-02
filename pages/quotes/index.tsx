import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useQuotesStore } from "@/store/quotes";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Quote } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { MdAddCircleOutline, MdCopyAll, MdDelete, MdEdit, MdOutlinePictureAsPdf, MdSearch } from "react-icons/md";

const QuoteComponent = () => {

    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const [quotes, setProducts] = useState<Quote[]>([]);
    const { setIsLoading, setDialog } = useAppStore();
    const { setSelectedQuote } = useQuotesStore();

    const [searchTerm, setSearchTerm] = useState<string>("");

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSearchTerm(e.target.value);
    };

    const handleEdit = (event: any, _selectedQuote: Partial<Quote>) => {
        event.stopPropagation();
        router.push(`/quotes/${_selectedQuote.id}`);
    };

    const handleClone = (event: any, _selectedQuote: Partial<Quote>) => {
        event.stopPropagation();
        setSelectedQuote(_selectedQuote);
        router.push("/quotes/create");
    };

    const handleExportPdf = (event: any, _selectedQuote: Partial<Quote>) => {
        event.stopPropagation();
        window.open(`/api/quotes/pdf/${_selectedQuote.id}`, "_blank");
    };

    const handleCreateNew = () => {
        router.push("/quotes/create");
    };

    const handleDelete = async (event: any, quote: Partial<Quote>) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteQuote(quote), t)
            .then(content => setDialog(content));
    };

    const deleteQuote = async (quote: Partial<Quote>) => {
        setDialog(null);
        await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
        await fetchQuotes();
    };

    const fetchQuotes = useCallback(async () => {
        doActionWithLoader(
            setIsLoading,
            async () => {
                const _quotes = await fetch(`/api/quotes?search=${searchTerm}`, { method: "GET" })
                    .then((res) => res.json());
                setProducts(_quotes);
            },
            (error: any) => alert(error.message)
        );
    }, [searchTerm, setIsLoading]);

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString();
    };

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("quotes")) {
            router.push("/");
        }

        setSelectedQuote(null);
        fetchQuotes();
    }, [user, router, fetchQuotes, setSelectedQuote]);

    useEffect(() => {
        fetchQuotes();
    }, [searchTerm, fetchQuotes]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="flex text-xl font-semibold text-gray-800 border-b pb-2 mb-4 ">
                    <span className="capitalize">{t("quotes.table.title")}</span>
                </div>

                <h1></h1>
                <div className="flex item-center justify-end w-full my-4">
                    <button
                        className="btn-primary"
                        onClick={handleCreateNew}>
                        <div>
                            <MdAddCircleOutline />
                        </div>
                        <div className="uppercase font-bold text-sm">{t("quotes.button.addQuote")}</div>
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full mx-auto border border-gray-300 px-4 py-2 bg-gray-50 shadow-sm my-4">
                    <MdSearch className="text-gray-500 text-xl" />
                    <input
                        required
                        type="text"
                        className="w-full bg-transparent focus:outline-none text-sm placeholder-gray-400"
                        placeholder="Cerca preventivo..."
                        onChange={handleSearch}
                    />
                </div>

                <table className="min-w-full text-sm border rounded-md shadow-sm overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">{t("quotes.table.head.date")}</th>
                            <th className="px-4 py-3 text-left">{t("quotes.table.head.ref")}</th>
                            <th className="px-4 py-3 text-left">{t("quotes.table.head.owner")}</th>
                            <th className="px-4 py-3 text-left" colSpan={4}>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map((q: Quote) =>
                            <tr key={q.id} className="table-row" onClick={(event) => handleEdit(event, q)}>
                                <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{formatDate(q.updatedAt)}</td>
                                <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{q.name}</td>
                                <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{q.createdBy}</td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleEdit(event, q)}><div><MdEdit /></div></td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleClone(event, q)}><div><MdCopyAll /></div></td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleExportPdf(event, q)}><div><MdOutlinePictureAsPdf /></div></td>
                                <td className="w-10 cursor-pointer text-red-600" onClick={(event) => handleDelete(event, q)}><MdDelete /></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default QuoteComponent;