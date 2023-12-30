import TextEditor from "@/components/TextEditor";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useI18nStore } from "@/store/i18n";
import { CategoryApiModel } from "@/types/api/categories";
import { Brand, Currency, Product } from "@prisma/client";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const ProductEdit = () => {

    const router = useRouter();
    const params = useParams();
    const user = useAuth();

    const { t } = useI18nStore();

    const [ product, setProduct ] = useState<Partial<Product>>({});
    const [ brands, setBrands ] = useState<Brand[]>([]);
    const [ categories, setCategories ] = useState<CategoryApiModel[]>([]);
    const [ currencies, setCurrencies ] = useState<Currency[]>([]);

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
        router.push("/products");
    };

    const handleSaveProduct = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const endpoint = `/api/products/${params.id}`;
            const body: Partial<Product> = {
                id: product.id,
                name: product.name,
                code: product.code,
                brandId: product.brandId,
                categoryId: product.categoryId,
                photo: null,
                description: product.description,
                price: product.price,
                currencyId: product.currencyId,
                createdById: product.createdById ?? 0
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
        if (!user || !params?.id) return;

        if (!user?.userRole.grants?.includes("products")) {
            router.push("/");
            return;
        }

        const fetchProduct = async () => {
            const _product = await fetch(`/api/products/${params.id}`, { method: "GET" }).then((res) => res.json());
            setProduct(_product);
        };

        fetchBrands();
        fetchCategories();
        fetchCurrency();
        fetchProduct();
    }, [ params, user, router ]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">{t("products.form.title")}</div>
                <div className="card-body">
                    <form className="w-[90%]" onSubmit={handleSaveProduct}>
                        <div className="w-full my-4">
                            <div className="font-extrabold text-lg uppercase">{t("products.form.code")}</div>
                            <input
                                type="text"
                                required
                                value={product.code}
                                className="text-input"
                                onChange={handleCodeChanged} />
                        </div>
                        <div className="w-full my-4">
                            <div className="font-extrabold text-lg uppercase">{t("products.form.name")}</div>
                            <input
                                type="text"
                                required
                                value={product.name}
                                className="text-input"
                                onChange={handleNameChanged} />
                        </div>
                        <div className='w-full my-4'>
                            <div className='font-extrabold text-lg uppercase'>{t("products.form.category")}</div>
                            <select className='text-input'
                                required
                                value={product.categoryId}
                                onChange={handleCategoryChanged} >
                                <option value={undefined}></option>
                                {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>
                        <div className='w-full my-4'>
                            <div className='font-extrabold text-lg uppercase'>{t("products.form.brand")}</div>
                            <select className='text-input'
                                required
                                value={product.brandId}
                                onChange={handleBrandChanged} >
                                <option value={undefined}></option>
                                {brands.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>
                        <div className='w-full my-4'>
                            <div className='font-extrabold text-lg uppercase'>{t("products.form.description")}</div>
                            <div className="bg-white">
                                <TextEditor initialValue={product.description} onChange={handleDescriptionChanged} />
                            </div>
                        </div>
                        <div className='w-full my-4 grid-cols-3 grid grid-template-columns: repeat(3, minmax(0, 1fr)) gap-2'>
                            <div>
                                <div className='font-extrabold text-lg uppercase'>{t("products.form.tags")}</div>
                                <input className='text-input'
                                    type="text"
                                    value={product.tags}
                                    onChange={handleTagsChanged} >
                                </input>
                            </div>
                            <div>
                                <div className='font-extrabold text-lg uppercase'>{t("products.form.price")}</div>
                                <input
                                    type="number"
                                    min={0}
                                    required
                                    value={product.price}
                                    className="text-input"
                                    onChange={handlePriceChanged} />
                            </div>
                            <div>
                                <div className='font-extrabold text-lg uppercase'>{t("products.form.currency")}</div>
                                <select className='text-input'
                                    required
                                    value={product.currencyId}
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
                                <div className="uppercase font-bold text-lg">{t("common.back")}</div>
                            </button>

                            <button
                                type="submit"
                                className="btn-primary">
                                <div className="uppercase font-bold text-lg">{t("products.button.save")}</div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default ProductEdit;