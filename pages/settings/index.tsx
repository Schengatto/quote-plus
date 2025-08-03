import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { TenantPlaceholders } from "@/types/tenants";
import { doActionWithLoader } from "@/utils/actions";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { MdDownload, MdOutlineSave } from "react-icons/md";

const defaultTenantPlaceholders = {
    products: "{{products}}",
    price: "{{price}}",
    currency: "{{currency}}",
    "discounted-price": "{{discounted-price}}"
};

const TenantsPage = () => {

    const auth = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();

    const [tenantId, setTenantId] = useState<String>();
    const [placeholders, setPlaceholders] = useState<TenantPlaceholders>(defaultTenantPlaceholders);

    const handleValueChange = (e: ChangeEvent<HTMLInputElement>, key: string) => {
        e.preventDefault();
        setPlaceholders((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (tenantId === null) return;

        const body = {
            id: tenantId,
            placeholders: placeholders
        };

        try {
            await fetch(`/api/tenants/${tenantId}`, { method: "PATCH", body: JSON.stringify(body) })
                .then((res) => res.json());
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
        await fetchTenant();
    };

    const handleDownloadQuotesBackup = async () => {
        const quotes = await fetch("/api/quotes").then((res) => res.json());
        const jsonString = JSON.stringify(quotes, undefined, 2);

        let dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(jsonString);
        let link = document.createElement("a");
        link.setAttribute("href", dataUri);
        link.setAttribute("download", `quotes${new Date().toISOString()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchTenant = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _tenant = await fetch(`/api/tenants/${auth?.tenantId}`, { method: "GET" })
                .then((res) => res.json());
            setTenantId(_tenant.id);
            setPlaceholders(_tenant.placeholders);
        });
    }, [auth, setIsLoading]);

    useEffect(() => {
        if (!auth) return;
        fetchTenant();
    }, [auth, fetchTenant]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("tenants.form.title")}</span>
                </div>

                <div className="card-body">
                    {tenantId &&
                        <form onSubmit={handleSave} className="w-full">
                            <div className="flex gap-4 w-full flex-col xl:flex-row my-4">
                                <div className="w-full">
                                    <div className="field-label">{t("tenants.form.products")}</div>
                                    <input
                                        type="text"
                                        value={placeholders.products}
                                        required
                                        className="text-input"
                                        onChange={(e) => handleValueChange(e, "products")} />
                                </div>

                                <div className="w-full">
                                    <div className="field-label">{t("tenants.form.price")}</div>
                                    <input
                                        type="text"
                                        value={placeholders.price}
                                        required
                                        className="text-input"
                                        onChange={(e) => handleValueChange(e, "price")} />
                                </div>

                                <div className="w-full">
                                    <div className="field-label">{t("tenants.form.currency")}</div>
                                    <input
                                        type="text"
                                        value={placeholders.currency}
                                        required
                                        className="text-input"
                                        onChange={(e) => handleValueChange(e, "currency")} />
                                </div>

                                <div className="w-full">
                                    <div className="field-label">{t("tenants.form.discountedPrice")}</div>
                                    <input
                                        type="text"
                                        value={placeholders["discounted-price"]}
                                        required
                                        className="text-input"
                                        onChange={(e) => handleValueChange(e, "discounted-price")} />
                                </div>
                            </div>
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    type="submit"
                                    className="btn-primary">
                                    <div>
                                        <MdOutlineSave />
                                    </div>
                                    <div className="uppercase font-bold text-sm">{t("common.save")}</div>
                                </button>
                            </div>
                        </form>
                    }
                </div>
            </div>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">Backup</span>
                </div>

                <div className="flex items-start gap-4">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleDownloadQuotesBackup}>
                        <div>
                            <MdDownload />
                        </div>
                        <div className="uppercase font-bold text-sm">{t("settings.button.downloadQuotesBackup")}</div>
                    </button>
                </div>
            </div>
        </AppLayout>
    );
};

export default TenantsPage;