import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useQuotesStore } from "@/store/quotes";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { orderAscByProperty, orderDescByProperty } from "@/utils/array";
import { Quote } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MdAddCircleOutline, MdArrowDownward, MdArrowUpward, MdCopyAll, MdDelete, MdEdit, MdOutlinePictureAsPdf, MdSearch, MdUnfoldMore } from "react-icons/md";

type SortField = "updatedAt" | "name" | "createdBy";
type SortDirection = "asc" | "desc";

/** Direction a column starts from when it first becomes the active one. */
const INITIAL_DIRECTION: Record<SortField, SortDirection> = {
    updatedAt: "desc",
    name: "asc",
    createdBy: "asc",
};

type SortableHeaderProps = {
    field: SortField;
    label: string;
    activeField: SortField;
    direction: SortDirection;
    onSort: (field: SortField) => void;
    className?: string;
};

const SortableHeader = ({ field, label, activeField, direction, onSort, className = "" }: SortableHeaderProps) => {
    const isActive = field === activeField;
    return (
        <th
            className={`px-4 py-3 text-left cursor-pointer select-none ${className}`}
            aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
            onClick={() => onSort(field)}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                {isActive
                    ? (direction === "asc" ? <MdArrowUpward /> : <MdArrowDownward />)
                    : <MdUnfoldMore className="opacity-30" />}
            </div>
        </th>
    );
};

const QuoteComponent = () => {

    const router = useRouter();
    const { userData: user } = useAuth();

    const { t } = useI18nStore();
    const [ quotes, setQuotes ] = useState<Quote[]>([]);
    const { setIsLoading, setDialog } = useAppStore();
    const { setSelectedQuote } = useQuotesStore();

    const [ searchTerm, setSearchTerm ] = useState<string>("");
    const [ sortField, setSortField ] = useState<SortField>("updatedAt");
    const [ sortDirection, setSortDirection ] = useState<SortDirection>(INITIAL_DIRECTION.updatedAt);

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection((prev) => prev === "asc" ? "desc" : "asc");
            return;
        }
        setSortField(field);
        setSortDirection(INITIAL_DIRECTION[field]);
    };

    // Dates arrive from the API as ISO strings, which sort chronologically as text.
    const sortedQuotes: Quote[] = useMemo(
        () => sortDirection === "asc"
            ? orderAscByProperty(quotes, sortField)
            : orderDescByProperty(quotes, sortField),
        [ quotes, sortField, sortDirection ]
    );

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
        router.push(`/quotes/${_selectedQuote.id}?print=true`);
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
                setQuotes(_quotes);
            },
            (error: any) => alert(error.message)
        );
    }, [ searchTerm, setIsLoading ]);

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
    }, [ user, router, fetchQuotes, setSelectedQuote ]);

    useEffect(() => {
        fetchQuotes();
    }, [ searchTerm, fetchQuotes ]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
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
                        <div className="uppercase text-sm">{t("quotes.button.addQuote")}</div>
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
                            <SortableHeader
                                field="updatedAt"
                                label={t("quotes.table.head.date")}
                                activeField={sortField}
                                direction={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                field="name"
                                label={t("quotes.table.head.ref")}
                                activeField={sortField}
                                direction={sortDirection}
                                onSort={handleSort}
                            />
                            <SortableHeader
                                field="createdBy"
                                label={t("quotes.table.head.owner")}
                                activeField={sortField}
                                direction={sortDirection}
                                onSort={handleSort}
                            />
                            <th className="py-3 text-left" colSpan={4}>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedQuotes.map((q: Quote) =>
                            <tr key={q.id} className="table-row" onClick={(event) => handleEdit(event, q)}>
                                <td className="px-4 py-3 text-sm w-auto truncate max-w-0">{formatDate(q.updatedAt)}</td>
                                <td className="px-4 py-3 text-sm w-auto truncate max-w-0">{q.name}</td>
                                <td className="px-4 py-3 text-sm w-auto truncate max-w-0">{q.createdBy}</td>
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