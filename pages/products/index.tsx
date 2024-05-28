import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useProductsStore } from "@/store/products";
import { doActionWithLoader } from "@/utils/actions";
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
            .then((res) => res.json());
        setProducts(_products);
    };

    const categoryLabel = ({ category }: any | ProductList): string => {
        return category.parent
            ? `${category.parent.name} » ${category.name}`
            : category.name;
    };

    const [ searchTerm, setSearchTerm ] = useState<string>("");

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSearchTerm(e.target.value.toLowerCase());
    };

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("products")) {
            router.push("/");
        }

        doActionWithLoader(setIsLoading, fetchProducts);
        setSelectedProduct(null);
    }, [ user, router, setIsLoading, setSelectedProduct ]);

    return (
        <AppLayout>
            <div className="m-8">
                <table className="items-table">
                    <thead>
                        <tr className="table-header">
                            <th colSpan={2} className="text-white uppercase p-2 text-sm">{t("products.table.title")}</th>
                            <th colSpan={4}>
                                <input
                                    required
                                    type="text"
                                    className="text-input"
                                    placeholder="search product"
                                    onChange={handleSearch} />
                            </th>
                        </tr>
                        <tr className="bg-gray-700 border-2 border-gray-700">
                            <th className="mx-2 text-white uppercase p-2 text-sm text-left">{t("products.table.head.ref")}</th>
                            <th className="mx-2 text-white uppercase p-2 text-sm text-left">{t("products.table.head.product")}</th>
                            <th className="mx-2 text-white uppercase p-2 text-sm text-left">{t("products.table.head.category")}</th>
                            <th className="mx-2 text-white uppercase p-2 text-sm text-left">{t("products.table.head.price")}</th>
                            <th className="mx-2 text-white uppercase p-2 text-sm text-left"></th>
                            <th className="mx-2 text-white uppercase p-2 text-sm text-left"></th>
                            <th className="mx-2 text-white uppercase p-2 text-sm text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.filter(p => p.name.toLowerCase()?.includes(searchTerm)).map((p: Partial<ProductList>) =>
                            <tr key={p.id} className="table-row" onClick={(event) => handleEdit(event, p)}>
                                <td className="mx-2 text-sm font-bold p-2 w-auto truncate max-w-0">{p.code}</td>
                                <td className="mx-2 text-sm font-bold p-2 w-auto truncate max-w-0">{p.name}</td>
                                <td className="mx-2 text-sm font-bold p-2 w-auto truncate max-w-0">{categoryLabel(p)}</td>
                                <td className="mx-2 text-sm font-bold p-2 w-auto truncate max-w-0">{p.price}</td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleEdit(event, p)}><div><MdEdit /></div></td>
                                <td className="w-10 cursor-pointer" onClick={(event) => handleClone(event, p)}><div><MdCopyAll /></div></td>
                                <td className="w-10 cursor-pointer text-red-600" onClick={(event) => handleDelete(event, p)}><MdDelete /></td>
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
                    <div className="uppercase font-bold text-sm">{t("products.button.addProduct")}</div>
                </button>
            </div>
        </AppLayout>
    );
};

export default ProductList;