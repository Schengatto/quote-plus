import TextEditor from "@/components/TextEditor";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { useQuotesStore } from "@/store/quotes";
import { CategoryApiModel } from "@/types/api/categories";
import { TenantPlaceholders } from "@/types/tenants";
import { doActionWithLoader } from "@/utils/actions";
import { Product, Quote, Template } from "@prisma/client";
import { Parser } from "html-to-react";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

const QuoteCreate = () => {

    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();
    const { selectedQuote, setSelectedQuote } = useQuotesStore();

    const [ placeholders, setPlaceholders ] = useState<Partial<TenantPlaceholders>>({});
    const [ quoteName, setQuoteName ] = useState<string>(selectedQuote?.name ?? "");
    const [ quoteContent, setQuoteContent ] = useState<string>(selectedQuote?.content ?? "");
    const [ products, setProducts ] = useState<Product[]>([]);
    const [ templates, setTemplates ] = useState<Template[]>([]);
    const [ categories, setCategories ] = useState<CategoryApiModel[]>([]);
    const [ selectedCategory, setSelectedCategory ] = useState<number | undefined>(undefined);
    const [ selectedProduct, setSelectedProduct ] = useState<Product | undefined>(undefined);
    const [ selectedProductDiscount, setSelectedProductDiscount ] = useState<number>(0);
    const [ quoteOverview, setQuoteOverview ] = useState<string>("");

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setQuoteName(e.target.value);
    };

    const handleTemplateChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const templateId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setQuoteContent(templates.find(t => t.id === templateId)?.content || "");
    };

    const handleCategoryChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const categoryId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setSelectedCategory(categoryId);
    };

    const handleProductChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const productId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        const _product: Product | undefined = products.find(p => p.id === productId) || undefined;
        setSelectedProduct(_product);
    };

    const handleDiscountChanged = (e: ChangeEvent<HTMLInputElement>) => {
        const _discount: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setSelectedProductDiscount(_discount);
    };

    const handleContentChanged = (value: string) => {
        setQuoteContent(value);
    };

    const handleAddSelectedProduct = () => {
        setQuoteContent((prev) => {
            if (!selectedProduct) return prev;

            const _productDescription = selectedProduct.description
                .replaceAll(placeholders.price!, String(selectedProduct.price))
                .replaceAll(placeholders.currency!, "€")
                .replaceAll(placeholders["discounted-price"]!, String(((selectedProduct.price / 100) * (100 - selectedProductDiscount)).toFixed(2)).replace(".", ","));

            return prev.includes(placeholders.products!)
                ? prev.replaceAll(placeholders.products!, `${_productDescription}{{products}}`)
                : prev.concat(_productDescription);
        });
    };

    const handleBack = () => {
        setSelectedQuote(null);
        router.push("/quotes");
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const endpoint = "/api/quotes";
            const body: Partial<Quote> = {
                name: quoteName,
                content: quoteContent,
                createdBy: user?.username,
                createdById: user?.id,
                updatedBy: user?.username,
                updatedById: user?.id,
            };
            const response = await fetch(endpoint, { method: "POST", body: JSON.stringify(body) }).then(
                (res) => res.json()
            );

            if (!response.id) {
                throw Error("Preventivo non creato!");
            }
            router.push("/quotes");
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
    };

    const fetchCategories = useCallback(async () => {
        const _categories = await fetch("/api/categories", { method: "GET" }).then((res) => res.json());
        setCategories(_categories);
    }, []);

    const fetchProducts = useCallback(async () => {
        const _products = await fetch(`/api/products?categoryId=${selectedCategory}`, { method: "GET" }).then((res) => res.json());
        setProducts(_products);
    }, [ selectedCategory ]);

    const fetchUserTemplates = useCallback(async () => {
        const _templates = await fetch(`/api/templates?userId=${user!.id}`, { method: "GET" })
            .then((res) => res.json());
        setTemplates(_templates);
    }, [ user ]);

    const fetchTenantPlaceholders = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _tenant = await fetch(`/api/tenants/${user?.tenantId}`, { method: "GET" })
                .then((res) => res.json());
            setPlaceholders(_tenant.placeholders);
        });
    }, [ user, setIsLoading ]);

    useEffect(() => {
        if (!user) return;

        if (!user?.userRole.grants?.includes("quotes")) {
            router.push("/");
            return;
        }

        fetchTenantPlaceholders();
        fetchCategories();
        fetchUserTemplates();

        return () => {
            setSelectedQuote(null);
        };
    }, [ user, router, setSelectedQuote, fetchTenantPlaceholders, fetchCategories, fetchUserTemplates ]);

    useEffect(() => {
        if (selectedCategory) {
            fetchProducts();
        }
    }, [ selectedCategory, fetchProducts ]);

    useEffect(() => {
        setQuoteOverview(() => quoteContent.replaceAll(placeholders.products || "{{products}}", ""));
    }, [ quoteContent ]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">{t("quotes.create.title")}</div>
                <div className="card-body">
                    <form className="w-[90%]" onSubmit={handleSave}>
                        <div className="w-full my-4">
                            <div className="font-extrabold text-sm uppercase">{t("quotes.form.name")}</div>
                            <input
                                required
                                type="text"
                                className="text-input"
                                value={quoteName}
                                onChange={handleNameChanged} />
                        </div>
                        <div className='w-full my-4'>
                            <div className='font-extrabold text-sm uppercase'>{t("quotes.form.template")}</div>
                            <select className='text-input'
                                onChange={handleTemplateChanged} >
                                <option value={undefined}></option>
                                {templates.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>

                        <div id="import-product-template">
                            <div className='w-full my-4 grid-cols-3 grid grid-template-columns: repeat(3, minmax(0, 1fr)) gap-2'>
                                <div className='w-full my-4'>
                                    <div className='font-extrabold text-sm uppercase'>{t("quotes.form.category")}</div>
                                    <select className='text-input'
                                        onChange={handleCategoryChanged} >
                                        <option value={undefined}></option>
                                        {categories.filter(c => c.products.length).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                                <div className='w-full my-4'>
                                    <div className='font-extrabold text-sm uppercase'>{t("quotes.form.product")}</div>
                                    <select className='text-input'
                                        disabled={!selectedCategory}
                                        onChange={handleProductChanged} >
                                        <option value={undefined}></option>
                                        {products.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                                <div className='w-full my-4'>
                                    <div className='font-extrabold text-sm uppercase'>{t("quotes.form.discount")}</div>
                                    <input
                                        min={0}
                                        max={100}
                                        type="number"
                                        className="text-input"
                                        onChange={handleDiscountChanged} />
                                </div>
                            </div>
                            <div className="flex justify-center items-center">
                                <button
                                    type="button"
                                    disabled={!selectedProduct}
                                    className="btn-primary"
                                    onClick={handleAddSelectedProduct}>
                                    <div className="uppercase font-bold text-sm">{t("quotes.button.addProduct")}</div>
                                </button>
                            </div>
                        </div>

                        <div className='w-full my-4'>
                            <div className='font-extrabold text-sm uppercase'>{t("quotes.form.description")}</div>
                            <div className="bg-white">
                                <TextEditor initialValue={quoteContent} onChange={handleContentChanged} />
                            </div>
                        </div>

                        {quoteOverview
                            && <div className='w-full my-4'>
                                <div className='font-extrabold text-sm uppercase'>{t("quotes.form.pdfPreview")}</div>
                                <div className="bg-white max-h-96 overflow-auto p-2 w-[210mm] border-2 border-dashed border-black">
                                    {Parser().parse(quoteOverview)}
                                </div>
                            </div>
                        }

                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleBack}>
                                <div className="uppercase font-bold text-sm">{t("common.back")}</div>
                            </button>

                            <button
                                type="submit"
                                className="btn-primary">
                                <div className="uppercase font-bold text-sm">{t("quotes.button.save")}</div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default QuoteCreate;