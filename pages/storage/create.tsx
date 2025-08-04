import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { CategoryApiModel } from "@/types/api/categories";
import { doActionWithLoader } from "@/utils/actions";
import { Item, Product } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import ItemList from ".";
import { MdDelete } from "react-icons/md";
import { formatDate } from "date-fns";
import AutoComplete from "@/components/AutoComplete";

const RepairCreate = () => {

    const searchParams = useSearchParams();
    const type = searchParams.get("type");

    const router = useRouter();
    const {userData: user} = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();

    const [items, setItems] = useState<ItemList[]>([]);
    const [categories, setCategories] = useState<CategoryApiModel[]>([]);

    const [item, setItem] = useState<Partial<Item>>({});
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

    const [list, setList] = useState<Item[]>([]);

    const handleCategoryChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const categoryId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setItem((prev) => ({ ...prev, category: categoryId }));
    };

    const handleProductChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setItem((prev) => ({ ...prev, product: e.target.value }));
    };

    const handleCodeChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setItem((prev) => ({ ...prev, code: e.target.value }));
    };

    const handleDealerSelection = (dealer: string) => {
        setItem((prev) => ({ ...prev, dealer: dealer }));
    };

    const handleReferenceSelection = (reference: string) => {
        setItem((prev) => ({ ...prev, reference: reference }));
    };

    const handleReferenceChange = (e: ChangeEvent<HTMLInputElement>) => {
        setItem((prev) => ({ ...prev, reference: e.target.value }));
    };

    const handleDocumentChange = (e: ChangeEvent<HTMLInputElement>) => {
        setItem((prev) => ({ ...prev, document: e.target.value }));
    };

    const handleDateChange = (e: ChangeEvent<HTMLDataElement>) => {
        const date: Date = !!e.currentTarget.value ? new Date(e.currentTarget.value) : new Date();
        setItem((prev) => ({ ...prev, date }));
    };

    const handleNoteChange = (e: ChangeEvent<HTMLInputElement>) => {
        setItem((prev) => ({ ...prev, notes: e.target.value }));
    };

    const handleBack = () => {
        router.push("/storage");
    };

    const handleAddItem = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const endpoint = "/api/storage";
            const body: Partial<Item> = {
                category: item.category,
                product: item.product,
                code: item.code,
                dealer: item.dealer,
                reference: item.reference,
                document: item.document,
                date: item.date,
                notes: item.notes,
                type: type || "",
                createdBy: user?.username || "",
                updatedBy: user?.username || ""
            };
            const response = await fetch(endpoint, { method: "POST", body: JSON.stringify(body) }).then(
                (res) => res.json()
            );

            if (!response?.id) {
                throw Error("Qualcosa è andato storto, l'elemento è stato creato!");
            }

            setList((prev) => [...prev, response]);
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
    };

    const preventClick = (event: any, _selectedProduct: Partial<ItemList>) => {
        event.stopPropagation();
    };

    const fetchCategories = async () => {
        const _categories = await fetch("/api/categories", { method: "GET" }).then((res) => res.json());
        setCategories(_categories);
    };

    const deleteProduct = async (item: Partial<ItemList>) => {
        await doActionWithLoader(setIsLoading,
            () => fetch(`/api/storage/${item.id}`, { method: "DELETE" }),
            (error) => alert(error.message)
        );
        setList((prev) => prev.filter(i => i.id !== item.id));
    };

    const handleDelete = async (event: any, item: Partial<ItemList>) => {
        event.stopPropagation();
        await deleteProduct(item);
    };

    const fetchItems = async () => {
        const _items: Item[] = await fetch("/api/storage", { method: "GET" })
            .then((res) => res.json()) ?? [];
        const orderedItems = _items.map((i) => ({ ...i, date: new Date(i.date) })).sort((a, b) => b.date.getTime() - a.date.getTime());
        setItems(orderedItems);
    };

    const dealers = useMemo(() => Array.from(new Set(items.map(i => i.dealer))), [items]);
    const references = useMemo(() => Array.from(new Set(items.map(i => i.reference))), [items]);


    useEffect(() => {
        doActionWithLoader(
            setIsLoading,
            async () => {
                if (selectedProduct) {
                    setItem({ ...selectedProduct, id: undefined });
                };
            }
        );

        doActionWithLoader(setIsLoading, fetchItems);
        return () => setSelectedProduct(undefined);
    }, [selectedProduct, setIsLoading, setSelectedProduct]);

    useEffect(() => {
        fetchCategories();
        if (!user) return;
        if (!user?.userRole.grants?.includes("storage")) {
            router.push("/");
        }
    }, [router, user]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="flex page-title pb-2 mb-4">
                    <div className="cursor-pointer hover:text-sky-600 font-semibold border-b-2 border-gray-700 hover:border-sky-600"
                        onClick={handleBack}>
                        Matricole e Riparazioni
                    </div>
                    <div className="mx-2">/</div>
                    <div className="">
                        Inserimento Nuova {type === "repair" ? "Riparazione" : "Vendita"}
                    </div>
                </div>

                <div className="card">
                    <form className="w-full" onSubmit={handleAddItem}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="field-label">Categoria</label>
                                <select className="text-input" required onChange={handleCategoryChanged}>
                                    <option value={undefined}></option>
                                    {categories.filter(c => c.products.length).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="field-label">Prodotto</label>
                                <input type="text" required className="text-input" onChange={handleProductChanged} />
                            </div>

                            <div>
                                <label className="field-label">Matricola/Seriale</label>
                                <input type="text" required className="text-input" onChange={handleCodeChanged} />
                            </div>

                            <div>
                                <label className="field-label">Rivenditore</label>
                                <AutoComplete onSelect={handleDealerSelection} suggestions={dealers} required></AutoComplete>
                            </div>

                            <div>
                                <label className="field-label">Utilizzatore/Riferimento</label>
                                <AutoComplete onSelect={handleReferenceSelection} suggestions={references} required></AutoComplete>
                            </div>

                            <div>
                                <label className="field-label">Documento</label>
                                <input type="text" required className="text-input" onChange={handleDocumentChange} />
                            </div>

                            <div>
                                <label className="field-label">Data</label>
                                <input type="date" required className="text-input" onChange={handleDateChange} />
                            </div>

                            <div className="lg:col-span-2">
                                <label className="field-label">Note</label>
                                <input type="text" required className="text-input" onChange={handleNoteChange} />
                            </div>
                        </div>

                        <div className="flex justify-center items-center">
                            <button type="submit" className="btn-primary">
                                <div className="uppercase text-sm">Aggiungi</div>
                            </button>
                        </div>
                    </form>
                </div>

                <div>
                    <h2 className="text-l font-semibold text-gray-100 mt-8">Riepilogo {type === "sale" ? "Vendite" : "Riparazioni"} Inserite</h2>
                </div>
                <div className="items-table my-6 max-h-[70vh] overflow-y-auto">
                    <table className="min-w-full border rounded-md shadow text-sm">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2 text-left">Code</th>
                                <th className="px-4 py-2 text-left">Prodotto</th>
                                <th className="px-4 py-2 text-left">Rivenditore</th>
                                <th className="px-4 py-2 text-left">Riferimento</th>
                                <th className="px-4 py-2 text-left">Documento</th>
                                <th className="px-4 py-2 text-left">Data</th>
                                <th className="px-4 py-2 text-left">Notes</th>
                                <th className="px-4 py-2 text-left"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {list.map((i: Partial<Item>) => (
                                <tr key={i.id} className="odd:bg-white even:bg-gray-50 hover:bg-sky-50 transition">
                                    <td className="px-4 py-2" title={i.code}>{i.code}</td>
                                    <td className="px-4 py-2" title={i.product}>{i.product}</td>
                                    <td className="px-4 py-2" title={i.dealer}>{i.dealer}</td>
                                    <td className="px-4 py-2" title={i.reference}>{i.reference}</td>
                                    <td className="px-4 py-2" title={i.document}>{i.document}</td>
                                    <td className="px-4 py-2" title={String(i.date)}>{formatDate(i.date || new Date(), "dd/MM/yyyy")}</td>
                                    <td className="px-4 py-2" title={i.notes}>{i.notes}</td>
                                    <td className="px-4 py-2 text-center" onClick={(event) => preventClick(event, i)}>
                                        <button className="text-red-600 hover:text-red-800" onClick={(e) => handleDelete(e, i)}>
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!list.length && (
                                <tr>
                                    <td className="px-4 py-2 text-gray-800 italic bg-white" colSpan={8}>
                                        Nessun elemento inserito
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
};

export default RepairCreate;