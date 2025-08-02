import Dialog from "@/components/Dialog";
import RowActions from "@/components/dropdown";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { orderAscByProperty } from "@/utils/array";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Item } from "@prisma/client";
import { formatDate } from "date-fns";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete } from "react-icons/md";

type ItemList = Item;

const ItemList = () => {
    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [products, setProducts] = useState<ItemList[]>([]);
    const [orderBy, setOrderBy] = useState<string>("code");

    const preventClick = (event: any, _selectedProduct: Partial<ItemList>) => {
        event.stopPropagation();
    };

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
        await fetchProducts();
    };

    const fetchProducts = async () => {
        const _products = await fetch("/api/storage", { method: "GET" })
            .then((res) => res.json()) ?? [];
        const _productsWithCategoryLabel = _products.map((p: ItemList) => ({ ...p, categoryLabel: getCategoryLabel(p) }));
        setProducts(orderAscByProperty(_productsWithCategoryLabel, orderBy));
    };

    const getCategoryLabel = ({ category }: any | ItemList): string => {
        return category.parent
            ? `${category.parent.name} » ${category.name}`
            : category.name;
    };

    const [searchTerm, setSearchTerm] = useState<string>("");

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSearchTerm(e.target.value.toLowerCase());
    };

    const filterList = (i: Item) => i.code.toLowerCase()?.includes(searchTerm)
        || i.dealer.toLowerCase()?.includes(searchTerm)
        || i.reference?.toLowerCase()?.includes(searchTerm)
        || i.document.toLowerCase()?.includes(searchTerm);

    useEffect(() => {
        setProducts(orderAscByProperty(products, orderBy));
    }, [orderBy, setProducts]);

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("products")) {
            router.push("/");
        }

        doActionWithLoader(setIsLoading, fetchProducts);
    }, [user, router, setIsLoading]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="my-4">
                    <div className="flex justify-end content-end w-full gap-4">
                        <button
                            className="btn-primary"
                            onClick={handleCreateNewSale}>
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className="uppercase font-bold text-sm">Aggiungi Vendita</div>
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleCreateNewRepair}>
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className="uppercase font-bold text-sm">Aggiungi Riparazione</div>
                        </button>
                    </div>
                </div>
                <div className="items-table max-h-[70vh] overflow-y-auto">
                    <table className="items-table">
                        <thead>
                            <tr className="table-header">
                                <th colSpan={2} className="text-white uppercase p-2 text-sm">Ricerca</th>
                                <th colSpan={7}>
                                    <input
                                        required
                                        type="text"
                                        className="text-input"
                                        placeholder="matricola, rivenditore, utilizzatore, riferimento"
                                        onChange={handleSearch} />
                                </th>
                            </tr>
                            <tr className="bg-gray-700 border-2 border-gray-700">
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Tipo</th>
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Seriale</th>
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Prodotto</th>
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Rivenditore</th>
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Riferimento</th>
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Documento</th>
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Data</th>
                                <th colSpan={1} className="text-white uppercase p-2 text-sm">Notes</th>
                                <th className="mx-2 text-white uppercase p-2 text-sm text-left w-1/12 cursor-pointer" onClick={() => setOrderBy("code")}>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.filter(filterList).map((i: Partial<ItemList>) =>
                                <tr key={i.id} className="table-row">
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" title={i.type}>
                                        {i.type === "repair" ? "Riparazione" : "Vendita"}
                                    </td>
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" title={i.code}>{i.code}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" title={i.product}>{i.product}</td>
                                    <td className="mx-2 text-sm font-bold p-2 w-2/12 truncate max-w-0 text-left" title={i.dealer}>{i.dealer}</td>
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
                            {!products.length &&
                                <tr className="table-row mx-2">
                                    <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left" colSpan={15}>Nessun Risultato trovato</td>
                                </tr>}
                        </tbody>
                    </table>
                </div>
            </div>

        </AppLayout>
    );
};

export default ItemList;