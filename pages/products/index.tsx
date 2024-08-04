import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useProductsStore } from "@/store/products";
import { doActionWithLoader } from "@/utils/actions";
import { orderAscByProperty } from "@/utils/array";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Product, Product as ProductList } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { MdAddCircleOutline, MdCopyAll, MdDelete, MdEdit } from "react-icons/md";

const ProductList = () => {
    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();
    const { setSelectedProduct } = useProductsStore();

    const [ products, setProducts ] = useState<ProductList[]>([]);
    const [ orderBy, setOrderBy ] = useState<string>("code");

    const handleEdit = (event: any, _selectedProduct: Partial<ProductList>) => {
        event.stopPropagation();
        router.push(`/products/${_selectedProduct.id}`);
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
        const _productsWithCategoryLabel = _products.map((p: ProductList) => ( { ...p, categoryLabel: getCategoryLabel(p) } ));
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
            <div className="m-8">
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
                                <th className="mx-2 text-white uppercase p-2 text-sm text-center"></th>
                                <th className="mx-2 text-white uppercase p-2 text-sm text-center"></th>
                                <th className="mx-2 text-white uppercase p-2 text-sm text-center"></th>
                            </tr>
                        </thead>
                    </table>
                    <div className="items-table max-h-[70vh] overflow-y-auto">
                        <table className="items-table">
                            <tbody>
                                {products.filter(p => p.name.toLowerCase()?.includes(searchTerm)).map((p: Partial<ProductList>) =>
                                    <tr key={p.id} className="table-row" onClick={(event) => handleEdit(event, p)}>
                                        <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-left">{p.code}</td>
                                        <td className="mx-2 text-sm font-bold p-2 w-5/12 truncate max-w-0 text-left">{p.name}</td>
                                        <td className="mx-2 text-sm font-bold p-2 w-4/12 truncate max-w-0 text-left">{getCategoryLabel(p)}</td>
                                        <td className="mx-2 text-sm font-bold p-2 w-1/12 truncate max-w-0 text-right">{p.price} €</td>
                                        <td className="w-10 cursor-pointer" onClick={(event) => handleEdit(event, p)}>
                                            <div className="flex justify-center content-end">
                                                <MdEdit />
                                            </div>
                                        </td>
                                        <td className="w-10 cursor-pointer" onClick={(event) => handleClone(event, p)}>
                                            <div className="flex justify-center content-end">
                                                <MdCopyAll />
                                            </div>
                                        </td>
                                        <td className="w-10 cursor-pointer text-red-600" onClick={(event) => handleDelete(event, p)}>
                                            <div className="flex justify-center content-end">
                                                <MdDelete />
                                            </div>
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