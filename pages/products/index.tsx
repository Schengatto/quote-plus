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
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { MdAddCircleOutline, MdSearch, MdEdit, MdSave, MdClose, MdFileDownload, MdFileUpload } from "react-icons/md";

type ProductList = Product;

const ProductList = () => {
    const router = useRouter();
    const { userData: user } = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();
    const { setSelectedProduct } = useProductsStore();
    const [ selectedRow, setSelectedRow ] = useState<Partial<ProductList> | null>(null);
    const [ newProductPrice, setNewProductPrice ] = useState<number>(0);

    const [ products, setProducts ] = useState<ProductList[]>([]);
    const [ orderBy, setOrderBy ] = useState<string>("code");

    // Bulk price editing state
    const [ isEditingPrices, setIsEditingPrices ] = useState(false);
    const [ editedPrices, setEditedPrices ] = useState<Record<number, number>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = user?.userRole.grants?.includes("users-management");

    const preventClick = (event: any, _selectedProduct: Partial<ProductList>) => {
        event.stopPropagation();
    };

    const handleEdit = (event: any, _selectedProduct: Partial<ProductList>) => {
        event.stopPropagation();
        if (isEditingPrices) return;
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

    const fetchProducts = useCallback(async () => {
        const _products = await fetch("/api/products", { method: "GET" })
            .then((res) => res.json()) ?? [];
        const _productsWithCategoryLabel = _products.map((p: ProductList) => ({ ...p, categoryLabel: getCategoryLabel(p) }));
        setProducts(orderAscByProperty(_productsWithCategoryLabel, orderBy));
    }, [ orderBy ]);

    const getCategoryLabel = ({ category }: any | ProductList): string => {
        return category.parent
            ? `${category.parent.name} » ${category.name}`
            : category.name;
    };

    const [ searchTerm, setSearchTerm ] = useState<string>("");

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

    // --- Bulk price editing ---
    const handleStartEditPrices = () => {
        setIsEditingPrices(true);
        setEditedPrices({});
    };

    const handleCancelEditPrices = () => {
        setIsEditingPrices(false);
        setEditedPrices({});
    };

    const handleBulkPriceChange = (productId: number, value: string) => {
        const price = parseFloat(value);
        if (!isNaN(price) && price >= 0) {
            setEditedPrices((prev) => ({ ...prev, [productId]: price }));
        }
    };

    const handleSaveBulkPrices = async () => {
        const updates = Object.entries(editedPrices).map(([ id, price ]) => ({
            id: Number(id),
            price,
        }));

        if (updates.length === 0) {
            setIsEditingPrices(false);
            return;
        }

        await doActionWithLoader(
            setIsLoading,
            async () => {
                const response = await fetch("/api/products/bulk-prices", {
                    method: "PUT",
                    body: JSON.stringify(updates),
                }).then((res) => res.json());

                if (response.updated) {
                    await fetchProducts();
                    setIsEditingPrices(false);
                    setEditedPrices({});
                } else {
                    throw new Error(response.message || "Errore durante il salvataggio");
                }
            },
            (error) => alert(`${t("common.error.onSave")}, ${error.message}`)
        );
    };

    // --- CSV Export/Import ---
    const handleExportCsv = () => {
        window.open("/api/products/export-csv", "_blank");
    };

    const handleImportCsv = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();

        await doActionWithLoader(
            setIsLoading,
            async () => {
                const response = await fetch("/api/products/import-csv", {
                    method: "POST",
                    body: JSON.stringify({ csv: text }),
                }).then((res) => res.json());

                if (response.updated) {
                    alert(`${t("products.csv.importSuccess")}: ${response.updated}`);
                    await fetchProducts();
                } else {
                    throw new Error(response.message || "Errore durante l'importazione");
                }
            },
            (error) => alert(error.message)
        );

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
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
        setProducts((prev) => orderAscByProperty(prev, orderBy));
    }, [ orderBy, setProducts ]);

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("products")) {
            router.push("/");
        }

        doActionWithLoader(setIsLoading, fetchProducts);
        setSelectedProduct(null);
    }, [ user, router, setIsLoading, setSelectedProduct, fetchProducts ]);

    const changedCount = Object.keys(editedPrices).length;

    return (
        <AppLayout>
            <Dialog isVisible={!!selectedRow} title="Modifica prezzo" actions={changePriceDialogActions} onClose={() => setSelectedRow(null)} >
                <p className="text-white">Inserisci il nuovo prezzo di {selectedRow?.name} - prezz corrente: {selectedRow?.price} €</p>
                <div>
                    <div className='field-label my-2'><span className="text-white">{t("products.form.price")}</span></div>
                    <input
                        type="number"
                        min={0}
                        required
                        className="text-input"
                        onChange={handlePriceChanged} />
                </div>
            </Dialog>

            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelected}
            />

            <div className="m-2 xl:m-8">

                <div className="page-title">
                    <span className="capitalize">{t("products.table.title")}</span>
                </div>

                <div className="my-4">
                    <div className="flex justify-end content-end w-full gap-2 flex-wrap">
                        {isAdmin && !isEditingPrices && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={handleExportCsv}
                                    title={t("products.csv.export")}>
                                    <div><MdFileDownload /></div>
                                    <div className="uppercase text-sm">{t("products.csv.export")}</div>
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleImportCsv}
                                    title={t("products.csv.import")}>
                                    <div><MdFileUpload /></div>
                                    <div className="uppercase text-sm">{t("products.csv.import")}</div>
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleStartEditPrices}
                                    title={t("products.bulk.editPrices")}>
                                    <div><MdEdit /></div>
                                    <div className="uppercase text-sm">{t("products.bulk.editPrices")}</div>
                                </button>
                            </>
                        )}
                        {isEditingPrices && (
                            <>
                                <button
                                    className="btn-primary bg-red-600 hover:bg-red-700"
                                    onClick={handleCancelEditPrices}>
                                    <div><MdClose /></div>
                                    <div className="uppercase text-sm">{t("common.cancel")}</div>
                                </button>
                                <button
                                    className="btn-primary bg-green-600 hover:bg-green-700"
                                    onClick={handleSaveBulkPrices}
                                    disabled={changedCount === 0}>
                                    <div><MdSave /></div>
                                    <div className="uppercase text-sm">
                                        {t("common.save")} {changedCount > 0 && `(${changedCount})`}
                                    </div>
                                </button>
                            </>
                        )}
                        {!isEditingPrices && (
                            <button
                                className="btn-primary"
                                onClick={handleCreateNew}>
                                <div>
                                    <MdAddCircleOutline />
                                </div>
                                <div className="uppercase text-sm">{t("products.button.addProduct")}</div>
                            </button>
                        )}
                    </div>
                </div>

                {isEditingPrices && (
                    <div className="mb-3 px-4 py-2 bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded">
                        {t("products.bulk.hint")}
                    </div>
                )}

                <div>
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

                    <div className="max-h-[70vh] overflow-y-auto">
                        <table className="items-table">
                            <thead className="bg-gray-100 text-gray-700 sticky top-0 text-xs uppercase z-10">
                                <tr>
                                    <th className="uppercase px-4 py-3 text-sm text-left cursor-pointer" onClick={() => setOrderBy("code")}>
                                    </th>
                                    <th className="uppercase px-4 py-3 text-sm text-left w-1/12 cursor-pointer" onClick={() => setOrderBy("code")}>
                                        {t("products.table.head.ref")}
                                    </th>
                                    <th className="px-4 py-3 uppercase text-sm text-left w-5/12" onClick={() => setOrderBy("name")}>
                                        {t("products.table.head.product")}
                                    </th>
                                    <th className="px-4 py-3 uppercase text-sm text-left w-4/12 cursor-pointer" onClick={() => setOrderBy("categoryLabel")}>
                                        {t("products.table.head.category")}
                                    </th>
                                    <th className="uppercase px-4 py-3 text-sm text-left w-1/12" onClick={() => setOrderBy("price")}>
                                        {t("products.table.head.price")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 border-none">
                                {products.filter(p => p.name.toLowerCase()?.includes(searchTerm)).map((p: Partial<ProductList>) =>
                                    <tr key={p.id} className={`table-row ${isEditingPrices ? "cursor-default" : ""}`} onClick={(event) => handleEdit(event, p)}>
                                        <td onClick={(event) => preventClick(event, p)}>
                                            {!isEditingPrices && <RowActions actions={rowActions(p)} />}
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-0 text-left" title={p.code}>{p.code}</td>
                                        <td className="px-4 py-3 w-5/12 truncate max-w-0 text-left" title={p.name}>{p.name}</td>
                                        <td className="px-4 py-3 w-4/12 truncate max-w-0 text-left" title={getCategoryLabel(p)}>{getCategoryLabel(p)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {isEditingPrices ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    defaultValue={p.price}
                                                    className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        const newPrice = parseFloat(e.target.value);
                                                        if (p.id && !isNaN(newPrice) && newPrice !== p.price) {
                                                            handleBulkPriceChange(p.id, e.target.value);
                                                        } else if (p.id && newPrice === p.price) {
                                                            setEditedPrices((prev) => {
                                                                const next = { ...prev };
                                                                delete next[p.id!];
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <>{p.price} €</>
                                            )}
                                        </td>
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
