import Dialog from "@/components/Dialog";
import RowActions from "@/components/dropdown";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useProductsStore } from "@/store/products";
import { doActionWithLoader } from "@/utils/actions";
import { orderAscByProperty } from "@/utils/array";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Product } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { MdAddCircleOutline } from "react-icons/md";

type ProductList = Product;

const ProductList = () => {
    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();
    const { setSelectedProduct } = useProductsStore();
    const [selectedRow, setSelectedRow] = useState<Partial<ProductList> | null>(null);
    const [newProductPrice, setNewProductPrice] = useState<number>(0);

    const [products, setProducts] = useState<ProductList[]>([]);
    const [orderBy, setOrderBy] = useState<string>("code");

    const preventClick = (event: any, _selectedProduct: Partial<ProductList>) => {
        event.stopPropagation();
    };

    const handleEdit = (event: any, _selectedProduct: Partial<ProductList>) => {
        event.stopPropagation();
        router.push(`/products/${_selectedProduct.id}`);
    };

    const handleEditPrice = (event: any, _selectedProduct: Partial<ProductList>) => {
        setSelectedRow(_selectedProduct);
        event.stopPropagation();
    };

    const handlePriceChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setNewProductPrice(Number(e.target.value));
    };

    const handleClone = (event: any, _selectedProduct: Partial<Product>) => {
        event.stopPropagation();
        setSelectedProduct(_selectedProduct);
        router.push("/products/create");
    };

    const handleCreateNew = () => {
        router.push("/products/create");
    };

    const handleDelete = async (event: any, product: Partial<ProductList>) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteProduct(product), t)
            .then(content => setDialog(content));
    };

    const deleteProduct = async (product: Partial<ProductList>) => {
        setDialog(null);
        await doActionWithLoader(setIsLoading,
            () => fetch(`/api/products/${product.id}`, { method: "DELETE" }),
            (error) => alert(error.message)
        );
        await fetchProducts();
    };

    const fetchProducts = async () => {
        const _products = await fetch("/api/products", { method: "GET" })
            .then((res) => res.json()) ?? [];
        const _productsWithCategoryLabel = _products.map((p: ProductList) => ({ ...p, categoryLabel: getCategoryLabel(p) }));
        setProducts(orderAscByProperty(_productsWithCategoryLabel, orderBy));
    };

    const getCategoryLabel = ({ category }: any | ProductList): string => {
        return category.parent
            ? `${category.parent.name} » ${category.name}`
            : category.name;
    };

    const [searchTerm, setSearchTerm] = useState<string>("");

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleSaveProduct = async () => {
        if (!selectedRow?.id) return;

        try {
            const endpoint = `/api/products/${selectedRow?.id}`;
            const body: Partial<Product> = {
                id: selectedRow.id,
                name: selectedRow.name,
                code: selectedRow.code,
                brandId: selectedRow.brandId,
                categoryId: selectedRow.categoryId,
                photo: null,
                description: selectedRow.description,
                price: newProductPrice,
                currencyId: selectedRow.currencyId,
                createdById: selectedRow.createdById ?? 0
            };
            const response = await fetch(endpoint, { method: "PATCH", body: JSON.stringify(body) }).then(
                (res) => res.json()
            );

            if (!response.id) {
                throw Error("Prodotto non creato!");
            }
            router.push("/products");
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        } finally {
            setSelectedRow(null);
        }
    };

    const rowActions = (product: Partial<ProductList>) => [
        { label: t("common.edit"), onClick: (event: any) => handleEdit(event, product) },
        { label: t("common.editPrice"), onClick: (event: any) => handleEditPrice(event, product) },
        { label: t("common.clone"), onClick: (event: any) => handleClone(event, product) },
        { label: t("common.delete"), onClick: (event: any) => handleDelete(event, product) },
    ];

    const changePriceDialogActions = [
        { name: t("common.cancel"), callback: () => setSelectedRow(null) },
        { name: t("common.update"), callback: handleSaveProduct },
    ];

    useEffect(() => {
        setProducts(orderAscByProperty(products, orderBy));
    }, [orderBy, setProducts]);

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("products")) {
            router.push("/");
        }

        doActionWithLoader(setIsLoading, fetchProducts);
        setSelectedProduct(null);
    }, [user, router, setIsLoading, setSelectedProduct]);

    return (
        <AppLayout>
            <div className="my-8 mx-8">
                <Dialog isVisible={!!selectedRow} title="Modifica prezzo" actions={changePriceDialogActions} >
                    <p>Inserisci il nuovo prezzo di {selectedRow?.name} - prezz corrente: {selectedRow?.price} €</p>
                    <div>
                        <div className='font-extrabold text-sm uppercase'>{t("products.form.price")}</div>
                        <input
                            type="number"
                            min={0}
                            required
                            className="text-input"
                            onChange={handlePriceChanged} />
                    </div>
                </Dialog>
                <div className="my-4">
                    <div className="flex justify-end content-end w-full">
                        <button
                            className="btn-primary"
                            onClick={handleCreateNew}>
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className="uppercase font-bold text-sm">{t("products.button.addProduct")}</div>
                        </button>
                    </div>
                </div>
                <div>
                    <table className="items-table">
                        <thead>
                            <tr className="table-header">
                                <th colSpan={2} className="text-white uppercase p-2 text-sm">{t("products.table.title")}</th>
                                <th colSpan={5}>
                                    <input
                                        required
                                        type="text"
                                        className="text-input"
                                        placeholder="search product"
                                        onChange={handleSearch} />
                                </th>
                            </tr>
                            <tr className="bg-gray-700 border-2 border-gray-700">
                                <th className="mx-2 text-white uppercase p-2 text-sm text-left w-1/12 cursor-pointer" onClick={() => setOrderBy("code")}>
                                </th>
                                <th className="mx-2 text-white uppercase p-2 text-sm text-left w-1/12 cursor-pointer" onClick={() => setOrderBy("code")}>
                                    {t("products.table.head.ref")}
                                </th>
                                <th className="mx-2 text-white uppercase p-2 text-sm text-left w-5/12" onClick={() => setOrderBy("name")}>
                                    {t("products.table.head.product")}
                                </th>
                                <th className="mx-2 text-white uppercase p-2 text-sm text-left w-4/12 cursor-pointer" onClick={() => setOrderBy("categoryLabel")}>
                                    {t("products.table.head.category")}
                                </th>
                                <th className="mx-2 text-white uppercase p-2 text-sm text-left w-1/12" onClick={() => setOrderBy("price")}>
                                    {t("products.table.head.price")}
                                </th>
                            </tr>
                        </thead>
                    </table>
                    <div className="items-table max-h-[70vh] overflow-y-auto">
                        <table className="items-table">
                            <tbody>
                                {products.filter(p => p.name.toLowerCase()?.includes(searchTerm)).map((p: Partial<ProductList>) =>
                                    <tr key={p.id} className="table-row" onClick={(event) => handleEdit(event, p)}>
                                        <td onClick={(event) => preventClick(event, p)}><RowActions actions={rowActions(p)} /></td>
                                        <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left">{p.code}</td>
                                        <td className="mx-2 text-sm font-bold p-2 w-5/12 truncate max-w-0 text-left">{p.name}</td>
                                        <td className="mx-2 text-sm font-bold p-2 w-4/12 truncate max-w-0 text-left">{getCategoryLabel(p)}</td>
                                        <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-right">{p.price} €</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </AppLayout>
    );
};

export default ProductList;