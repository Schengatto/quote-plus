import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useQuotesStore } from "@/store/quotes";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Quote, Product as QuoteList } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { MdAddCircleOutline, MdCopyAll, MdDelete, MdEdit, MdOutlinePictureAsPdf, MdPictureAsPdf } from "react-icons/md";

const QuoteList = () => {

    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const [ quotes, setProducts ] = useState<Quote[]>([]);
    const { setIsLoading, setDialog } = useAppStore();
    const { setSelectedQuote } = useQuotesStore();

    const [ searchTerm, setSearchTerm ] = useState<string>("");

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSearchTerm(e.target.value);
    };

    const handleEdit = (event: any, _selectedQuote: Partial<QuoteList>) => {
        event.stopPropagation();
        router.push(`/quotes/${_selectedQuote.id}`);
    };

    const handleClone = (event: any, _selectedQuote: Partial<QuoteList>) => {
        event.stopPropagation();
        setSelectedQuote(_selectedQuote);
        router.push("/quotes/create");
    };

    const handleExportPdf = (event: any, _selectedQuote: Partial<QuoteList>) => {
        event.stopPropagation();
        window.open(`/api/quotes/pdf/${_selectedQuote.id}`, "_blank");
    };

    const handleCreateNew = () => {
        router.push("/quotes/create");
    };

    const handleDelete = async (event: any, quote: Partial<QuoteList>) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteQuote(quote), t)
            .then(content => setDialog(content));
    };

    const deleteQuote = async (quote: Partial<QuoteList>) => {
        setDialog(null);
        await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
        await fetchQuotes();
    };

    const fetchQuotes = async () => {
        doActionWithLoader(
            setIsLoading,
            async () => {
                const _quotes = await fetch(`/api/quotes?search=${searchTerm}`, { method: "GET" })
                    .then((res) => res.json());
                setProducts(_quotes);
            },
            (error: any) => alert(error.message)
        );
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
        fetchQuotes();
    }, [ user ]);

    useEffect(() => {
        fetchQuotes();
    }, [ searchTerm ]);

    return (
        <AppLayout>
            <div className="m-8">
                <table className="items-table">
                    <thead>
                        <tr className="table-header">
                            <th colSpan={7} className="text-white uppercase p-2 text-lg">{t("quotes.table.title")}</th>
                        </tr>
                        <tr className="bg-gray-700 border-2 border-gray-700">
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("quotes.table.head.date")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("quotes.table.head.ref")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("quotes.table.head.owner")}</th>
                            <th colSpan={4}>
                                <input
                                    required
                                    type="text"
                                    className="text-input"
                                    placeholder="search quote"
                                    onChange={handleSearch} />
                            </th>
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