import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useProductsStore } from "@/store/products";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Product, Product as ProductList } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
                            <th colSpan={6} className="text-white uppercase p-2 text-lg">{t("products.table.title")}</th>
                        </tr>
                        <tr className="bg-gray-700 border-2 border-gray-700">
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("products.table.head.ref")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("products.table.head.product")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("products.table.head.category")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p: Partial<ProductList>) =>
                            <tr key={p.id} className="table-row" onClick={(event) => handleEdit(event, p)}>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{p.code}</td>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{p.name}</td>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{categoryLabel(p)}</td>
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
                    <div className="uppercase font-bold text-lg">{t("products.button.addProduct")}</div>
                </button>
            </div>
        </AppLayout>
    );
};

export default ProductList;