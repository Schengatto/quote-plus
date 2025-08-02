import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Item } from "@prisma/client";
import { formatDate } from "date-fns";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete, MdSearch } from "react-icons/md";

type ItemList = Item;

const ItemList = () => {
    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [items, setItems] = useState<ItemList[]>([]);

    const handleCreateNewSale = () => {
        router.push("/storage/create?type=sale");
    };

    const handleCreateNewRepair = () => {
        router.push("/storage/create?type=repair");
    };

    const handleDelete = async (event: any, item: Partial<ItemList>) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteProduct(item), t)
            .then(content => setDialog(content));
    };

    const deleteProduct = async (item: Partial<ItemList>) => {
        setDialog(null);
        await doActionWithLoader(setIsLoading,
            () => fetch(`/api/storage/${item.id}`, { method: "DELETE" }),
            (error) => alert(error.message)
        );
        await fetchItems();
    };

    const fetchItems = async () => {
        const _items: Item[] = await fetch("/api/storage", { method: "GET" })
            .then((res) => res.json()) ?? [];
        const orderedItems = _items.map((i) => ({ ...i, date: new Date(i.date) })).sort((a, b) => b.date.getTime() - a.date.getTime());
        setItems(orderedItems);
    };

    const [searchTerm, setSearchTerm] = useState<string>("");

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSearchTerm(e.target.value.toLowerCase());
    };

    const filterList = (i: Item) => i.code.toLowerCase()?.includes(searchTerm)
        || i.dealer.toLowerCase()?.includes(searchTerm)
        || i.reference?.toLowerCase()?.includes(searchTerm)
        || i.product?.toLowerCase()?.includes(searchTerm)
        || i.document.toLowerCase()?.includes(searchTerm);

    useEffect(() => {
        setItems(items);
    }, [setItems]);

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("storage")) {
            router.push("/");
        }

        doActionWithLoader(setIsLoading, fetchItems);
    }, [user, router, setIsLoading]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="flex text-xl font-semibold text-gray-800 border-b pb-2 mb-4 ">
                    <span>Matricole e Riparazioni</span>
                </div>

                <div className="my-4">
                    <div className="flex justify-end content-end w-full gap-4">
                        <button className="btn-primary" onClick={handleCreateNewSale}>
                            <MdAddCircleOutline />
                            <span className="uppercase font-semibold text-sm">Aggiungi Vendita</span>
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleCreateNewRepair}>
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className="uppercase font-semibold text-sm">Aggiungi Riparazione</div>
                        </button>
                    </div>
                </div>
                <div className="items-table max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center gap-3 w-full mx-auto border border-gray-300 px-4 py-2 bg-gray-50 shadow-sm">
                        <MdSearch className="text-gray-500 text-xl" />
                        <input
                            required
                            type="text"
                            className="w-full bg-transparent focus:outline-none text-sm placeholder-gray-400"
                            placeholder="Cerca per matricola, rivenditore, utilizzatore, riferimento..."
                            onChange={handleSearch}
                        />
                    </div>
                    <table className="min-w-full text-sm border rounded-md shadow-sm overflow-hidden">
                        <thead className="bg-gray-100 text-gray-700 sticky top-0 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Tipo</th>
                                <th className="px-4 py-3 text-left">Seriale</th>
                                <th className="px-4 py-3 text-left">Prodotto</th>
                                <th className="px-4 py-3 text-left">Rivenditore</th>
                                <th className="px-4 py-3 text-left">Riferimento</th>
                                <th className="px-4 py-3 text-left">Documento</th>
                                <th className="px-4 py-3 text-left">Data</th>
                                <th className="px-4 py-3 text-left">Note</th>
                                <th className="px-4 py-3 text-center">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {items.filter(filterList).map((i: Partial<ItemList>) => (
                                <tr
                                    key={i.id}
                                    className="hover:bg-blue-50 transition-colors duration-200 odd:bg-white even:bg-gray-50"
                                >
                                    <td className="px-4 py-3">{i.type === "repair" ? "Riparazione" : "Vendita"}</td>
                                    <td className="px-4 py-3">{i.code}</td>
                                    <td className="px-4 py-3">{i.product}</td>
                                    <td className="px-4 py-3">{i.dealer}</td>
                                    <td className="px-4 py-3">{i.reference}</td>
                                    <td className="px-4 py-3">{i.document}</td>
                                    <td className="px-4 py-3">{formatDate(i.date || new Date(), "dd/MM/yyyy")}</td>
                                    <td className="px-4 py-3">{i.notes}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            className="text-red-600 hover:text-red-800"
                                            onClick={(e) => handleDelete(e, i)}
                                        >
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </div>

        </AppLayout>
    );
};

export default ItemList;