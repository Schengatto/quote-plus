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
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

const QuoteEdit = () => {

    const router = useRouter();
    const params = useParams();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();
    const { selectedQuote, setSelectedQuote } = useQuotesStore();

    const [ placeholders, setPlaceholders ] = useState<Partial<TenantPlaceholders>>({});
    const [ quoteContent, setQuoteContent ] = useState<string>("");
    const [ products, setProducts ] = useState<Product[]>([]);
    const [ templates, setTemplates ] = useState<Template[]>([]);
    const [ categories, setCategories ] = useState<CategoryApiModel[]>([]);
    const [ selectedCategory, setSelectedCategory ] = useState<number | null>(null);
    const [ selectedProduct, setSelectedProduct ] = useState<Product | null>(null);
    const [ selectedProductDiscount, setSelectedProductDiscount ] = useState<number>(0);
    const [ quoteOverview, setQuoteOverview ] = useState<string>("");

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSelectedQuote({ ...selectedQuote, name: e.target.value });
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
        const _product: Product | null = products.find(p => p.id === productId) || null;
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
                .replaceAll(placeholders["discounted-price"]!, String((selectedProduct.price / 100) * (100 - selectedProductDiscount)));

            return prev.includes(placeholders.products!)
                ? prev.replaceAll(placeholders.products!, `${_productDescription}${placeholders.products}`)
                : prev.concat(_productDescription);
        });
    };

    const handleBack = () => {
        setSelectedQuote(null);
        router.push(`/quotes/${params.id}`);
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const endpoint = `/api/quotes/${params.id}`;
            const body: Partial<Quote> = {
                ...selectedQuote,
                content: quoteContent,
                updatedBy: user?.username,
                updatedById: user?.id,
            };
            const response = await fetch(endpoint, { method: "PATCH", body: JSON.stringify(body) }).then(
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

    const fetchSelectedQuote = useCallback(async () => {
        const _quote = await fetch(`/api/quotes/${params.id}`, { method: "GET" }).then((res) => res.json());
        setSelectedQuote(_quote);
        setQuoteContent(_quote.content);
    }, [ params, setSelectedQuote ]);

    const fetchTenantPlaceholders = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _tenant = await fetch(`/api/tenants/${user?.tenantId}`, { method: "GET" })
                .then((res) => res.json());
            setPlaceholders(_tenant.placeholders);
        });
    }, [ user, setIsLoading ]);

    useEffect(() => {
        if (!user || !params?.id) return;
        if (!user?.userRole.grants?.includes("quotes")) {
            router.push("/");
            return;
        }
        fetchTenantPlaceholders();

        doActionWithLoader(setIsLoading, async () => await Promise.all([ fetchCategories(), fetchUserTemplates(), fetchSelectedQuote() ]));
    }, [ params, user, router, setIsLoading, fetchCategories, fetchSelectedQuote, fetchTenantPlaceholders, fetchUserTemplates ]);

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
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("quotes.edit.title")}</span>
                </div>
                <div className="card-body">
                    <form className="w-full" onSubmit={handleSave}>
                        <div className="w-full my-4">
                            <div className="field-label">{t("quotes.form.name")}</div>
                            <input
                                required
                                value={selectedQuote?.name}
                                type="text"
                                className="text-input"
                                onChange={handleNameChanged} />
                        </div>
                        <div className='w-full my-4'>
                            <div className='field-label'>{t("quotes.form.template")}</div>
                            <select className='text-input'
                                onChange={handleTemplateChanged} >
                                <option value={undefined}></option>
                                {templates.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>

                        <div>
                            <div className='w-full my-4 grid-cols-3 grid grid-template-columns: repeat(3, minmax(0, 1fr)) gap-2'>
                                <div className='w-full my-4'>
                                    <div className='field-label'>{t("quotes.form.category")}</div>
                                    <select className='text-input'
                                        onChange={handleCategoryChanged} >
                                        <option value={undefined}></option>
                                        {categories.filter(c => c.products.length).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                                <div className='w-full my-4'>
                                    <div className='field-label'>{t("quotes.form.product")}</div>
                                    <select className='text-input'
                                        disabled={!selectedCategory}
                                        onChange={handleProductChanged} >
                                        <option value={undefined}></option>
                                        {products.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                    </select>
                                </div>
                                <div className='w-full my-4'>
                                    <div className='field-label'>{t("quotes.form.discount")}</div>
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
                                    className="btn-primary"
                                    onClick={handleAddSelectedProduct}>
                                    <div className="uppercase text-sm">{t("quotes.button.addProduct")}</div>
                                </button>
                            </div>
                        </div>

                        <div className='w-full my-4'>
                            <div className='field-label'>{t("quotes.form.description")}</div>
                            <div className="bg-white">
                                <TextEditor initialValue={quoteContent} onChange={handleContentChanged} />
                            </div>
                        </div>

                        {quoteOverview
                            && <div className='w-full my-4'>
                                <div className='field-label'>{t("quotes.form.pdfPreview")}</div>
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
                                <div className="uppercase text-sm">{t("common.back")}</div>
                            </button>

                            <button
                                type="submit"
                                className="btn-primary">
                                <div className="uppercase text-sm">{t("quotes.button.save")}</div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default QuoteEdit;