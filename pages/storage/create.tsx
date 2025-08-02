import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { CategoryApiModel } from "@/types/api/categories";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Item, Product } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import ItemList from ".";
import { MdDelete } from "react-icons/md";
import { formatDate } from "date-fns";

const RepairCreate = () => {

    const searchParams = useSearchParams();
    const type = searchParams.get("type");

    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();

    const [categories, setCategories] = useState<CategoryApiModel[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);

    const [item, setItem] = useState<Partial<Item>>({});
    const [products, setProducts] = useState<Product[]>([]);
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

    const handleDealerChange = (e: ChangeEvent<HTMLInputElement>) => {
        setItem((prev) => ({ ...prev, dealer: e.target.value }));
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
            // router.push("/storage");
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

    useEffect(() => {
        doActionWithLoader(
            setIsLoading,
            async () => {
                if (selectedProduct) {
                    setItem({ ...selectedProduct, id: undefined });
                };
            }
        );
        return () => setSelectedProduct(undefined);
    }, [selectedProduct, setIsLoading, setSelectedProduct]);

    useEffect(() => {
        fetchCategories();
        if (!user) return;
        if (!user?.userRole.grants?.includes("products")) {
            router.push("/");
        }
    }, [router, user]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">Inserimento Nuova {type === "repair" ? "riparazione" : "vendita"}</div>
                <div className="card-body">
                    <form className="w-[90%]" onSubmit={handleAddItem}>
                        <div className='w-full grid-cols-3 grid grid-template-columns: repeat(3, minmax(0, 1fr)) gap-2'>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Categoria</div>
                                <select className='text-input'
                                    required
                                    onChange={handleCategoryChanged} >
                                    <option value={undefined}></option>
                                    {categories.filter(c => c.products.length).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                            </div>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Prodotto</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleProductChanged} />
                            </div>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Matricola/Seriale</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleCodeChanged} />
                            </div>
                        </div>

                        <div className='w-full grid-cols-2 grid grid-template-columns: repeat(4, minmax(0, 1fr)) gap-2'>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Rivenditore</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleDealerChange} />
                            </div>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Utilizzatore/Riferimento</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleReferenceChange} />
                            </div>
                        </div>

                        <div className='w-full grid-cols-3 grid grid-template-columns: repeat(3, minmax(0, 1fr)) gap-2'>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Documento</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleDocumentChange} />
                            </div>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Data</div>
                                <input
                                    type="date"
                                    required
                                    className="text-input"
                                    onChange={handleDateChange} />
                            </div>
                            <div className='w-full my-2'>
                                <div className='font-extrabold text-sm uppercase'>Note</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleNoteChange} />
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="submit"
                                className="btn-primary">
                                <div className="uppercase font-bold text-sm">Aggiungi</div>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="items-table my-4 max-h-[70vh] overflow-y-auto">
                    <table className="items-table">
                        <tr className="table-header">
                            <th colSpan={1} className="text-white uppercase p-2 text-sm">Code</th>
                            <th colSpan={1} className="text-white uppercase p-2 text-sm">Prodotto</th>
                            <th colSpan={1} className="text-white uppercase p-2 text-sm">Rivenditore</th>
                            <th colSpan={1} className="text-white uppercase p-2 text-sm">Riferimento</th>
                            <th colSpan={1} className="text-white uppercase p-2 text-sm">Documento</th>
                            <th colSpan={1} className="text-white uppercase p-2 text-sm">Data</th>
                            <th colSpan={1} className="text-white uppercase p-2 text-sm">Notes</th>
                            <th colSpan={1} className="text-white uppercase p-2 text-sm"></th>
                        </tr>
                        <tbody>
                            {list.map((i: Partial<Item>) =>
                                <tr key={i.id} className="table-row">
                                    <td className="mx-2 text-sm font-bold p-2 w-2/12 truncate max-w-0 text-left" title={i.code}>{i.code}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" title={i.product}>{i.product}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" title={i.dealer}>{i.dealer}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-2/12 truncate max-w-0 text-left" title={i.reference}>{i.reference}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" title={i.document}>{i.document}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" title={String(i.date)}>
                                        {formatDate(i.date || new Date(), "dd/MM/yyyy")}
                                    </td>
                                    <td className="mx-2 text-sm font-bold p-2 w-4/12 truncate max-w-0 text-left" title={i.notes}>{i.notes}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate text-center" onClick={(event) => preventClick(event, i)}>
                                        <button className="disabled:opacity-50 text-red-600"
                                            onClick={(e) => handleDelete(e, i)}>
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {!list.length &&
                                <tr className="table-row mx-2">
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" colSpan={15}>Nessun elemento inserito</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>

                <div>
                    <div className="flex justify-center items-center gap-4">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleBack}>
                            <div className="uppercase font-bold text-sm">Torna ad Elenco</div>
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default RepairCreate;