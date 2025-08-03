import TextEditor from "@/components/TextEditor";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useProductsStore } from "@/store/products";
import { CategoryApiModel } from "@/types/api/categories";
import { doActionWithLoader } from "@/utils/actions";
import { Brand, Currency, Product } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const ProductCreate = () => {

    const router = useRouter();
    const {userData: user} = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();
    const { setSelectedProduct, selectedProduct } = useProductsStore();

    const [product, setProduct] = useState<Partial<Product>>({});
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<CategoryApiModel[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);

    const handleCodeChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setProduct((prev) => ({ ...prev, code: e.target.value }));
    };
    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setProduct((prev) => ({ ...prev, name: e.target.value }));
    };

    const handleCategoryChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const categoryId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setProduct((prev) => ({ ...prev, categoryId }));
    };

    const handleBrandChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const brandId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setProduct((prev) => ({ ...prev, brandId }));
    };

    const handleDescriptionChanged = (value: string) => {
        setProduct((prev) => ({ ...prev, description: value }));
    };

    const handleTagsChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setProduct((prev) => ({ ...prev, tags: e.target.value }));
    };

    const handlePriceChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setProduct((prev) => ({ ...prev, price: Number(e.target.value) }));
    };

    const handleCurrencyChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const currencyId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setProduct((prev) => ({ ...prev, currencyId }));
    };

    const handleBack = () => {
        setSelectedProduct(null);
        router.push("/products");
    };

    const handleSaveProduct = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const endpoint = "/api/products";
            const body: Partial<Product> = {
                id: product.id,
                name: product.name,
                code: product.code,
                brandId: product.brandId,
                categoryId: product.categoryId,
                photo: null,
                description: product.description,
                tags: product.tags,
                price: product.price,
                currencyId: product.currencyId,
                createdById: user?.id || 0
            };
            const response = await fetch(endpoint, { method: "POST", body: JSON.stringify(body) }).then(
                (res) => res.json()
            );

            if (!response.id) {
                throw Error("Prodotto non creato!");
            }
            router.push("/products");
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
    };

    const fetchBrands = async () => {
        const _brands = await fetch("/api/brands", { method: "GET" })
            .then((res) => res.json());
        setBrands(_brands);
    };

    const fetchCategories = async () => {
        const _categories = await fetch("/api/categories", { method: "GET" }).then((res) => res.json());
        setCategories(_categories);
    };

    const fetchCurrency = async () => {
        const _currencies = await fetch("/api/currencies", { method: "GET" })
            .then((res) => res.json());
        setCurrencies(_currencies);
    };

    useEffect(() => {
        doActionWithLoader(
            setIsLoading,
            async () => {
                await Promise.all([fetchBrands(), fetchCategories(), fetchCurrency()]);
                if (selectedProduct) {
                    setProduct({ ...selectedProduct, id: undefined });
                };
            }
        );
        return () => setSelectedProduct(null);
    }, [selectedProduct, setIsLoading, setSelectedProduct]);

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("products")) {
            router.push("/");
        }
    }, [router, user]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("products.button.addProduct")}</span>
                </div>
                <div className="card-body">
                    <form className="w-full" onSubmit={handleSaveProduct}>
                        <div className="w-full my-4">
                            <div className="field-label">{t("products.form.code")}</div>
                            <input
                                type="text"
                                value={product.code}
                                required
                                className="text-input"
                                onChange={handleCodeChanged} />
                        </div>
                        <div className="w-full my-4">
                            <div className="field-label">{t("products.form.name")}</div>
                            <input
                                type="text"
                                value={product.name}
                                required
                                className="text-input"
                                onChange={handleNameChanged} />
                        </div>
                        <div className='w-full my-4'>
                            <div className='field-label'>{t("products.form.category")}</div>
                            <select className='text-input'
                                value={product.categoryId}
                                required
                                onChange={handleCategoryChanged} >
                                <option value={undefined}></option>
                                {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>
                        <div className='w-full my-4'>
                            <div className='field-label'>{t("products.form.brand")}</div>
                            <select className='text-input'
                                value={product.brandId}
                                required
                                onChange={handleBrandChanged} >
                                <option value={undefined}></option>
                                {brands.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>
                        <div className='w-full my-4'>
                            <div className='field-label'>{t("products.form.description")}</div>
                            <div className="bg-white">
                                <TextEditor initialValue={product.description} onChange={handleDescriptionChanged} />
                            </div>
                        </div>
                        <div className='w-full my-4 grid-cols-3 grid grid-template-columns: repeat(3, minmax(0, 1fr)) gap-2'>
                            <div>
                                <div className='field-label'>{t("products.form.tags")}</div>
                                <input
                                    type="text"
                                    value={product.tags}
                                    required
                                    className="text-input"
                                    onChange={handleTagsChanged} />
                            </div>
                            <div>
                                <div className='field-label'>{t("products.form.price")}</div>
                                <input
                                    type="number"
                                    min={0}
                                    value={product.price}
                                    required
                                    className="text-input"
                                    onChange={handlePriceChanged} />
                            </div>
                            <div>
                                <div className='field-label'>{t("products.form.currency")}</div>
                                <select className='text-input'
                                    value={product.currencyId}
                                    required
                                    onChange={handleCurrencyChanged} >
                                    <option value={undefined}></option>
                                    {currencies.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleBack}>
                                <div className="uppercase text-sm">{t("common.back")}</div>
                            </button>

                            <button
                                type="submit"
                                className="btn-primary">
                                <div className="uppercase text-sm">{t("products.button.save")}</div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default ProductCreate;