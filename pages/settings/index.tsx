import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { TenantPlaceholders } from "@/types/tenants";
import { doActionWithLoader } from "@/utils/actions";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { MdOutlineSave } from "react-icons/md";

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

    const [ tenantId, setTenantId ] = useState<String>();
    const [ placeholders, setPlaceholders ] = useState<TenantPlaceholders>(defaultTenantPlaceholders);

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

    const fetchTenant = async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _tenant = await fetch(`/api/tenants/${auth?.tenantId}`, { method: "GET" })
                .then((res) => res.json());
            setTenantId(_tenant.id);
            setPlaceholders(_tenant.placeholders);
        });
    };

    useEffect(() => {
        if (!auth) return;
        fetchTenant();
    }, [ auth ]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">{t("tenants.form.title")}</div>
                <div className="card-body">
                    {tenantId &&
                        <form onSubmit={handleSave}>
                            <div className="w-full my-4">
                                <div className="font-extrabold text-lg uppercase">{t("tenants.form.products")}</div>
                                <input
                                    type="text"
                                    value={placeholders.products}
                                    required
                                    className="text-input"
                                    onChange={(e) => handleValueChange(e, "products")} />
                            </div>

                            <div className="w-full my-4">
                                <div className="font-extrabold text-lg uppercase">{t("tenants.form.price")}</div>
                                <input
                                    type="text"
                                    value={placeholders.price}
                                    required
                                    className="text-input"
                                    onChange={(e) => handleValueChange(e, "price")} />
                            </div>

                            <div className="w-full my-4">
                                <div className="font-extrabold text-lg uppercase">{t("tenants.form.currency")}</div>
                                <input
                                    type="text"
                                    value={placeholders.currency}
                                    required
                                    className="text-input"
                                    onChange={(e) => handleValueChange(e, "currency")} />
                            </div>

                            <div className="w-full my-4">
                                <div className="font-extrabold text-lg uppercase">{t("tenants.form.discountedPrice")}</div>
                                <input
                                    type="text"
                                    value={placeholders["discounted-price"]}
                                    required
                                    className="text-input"
                                    onChange={(e) => handleValueChange(e, "discounted-price")} />
                            </div>

                            <div className="flex justify-center items-center gap-4">
                                <button
                                    type="submit"
                                    className="btn-primary">
                                    <div>
                                        <MdOutlineSave />
                                    </div>
                                    <div className="uppercase font-bold text-lg">{t("common.save")}</div>
                                </button>
                            </div>
                        </form>
                    }
                </div>
            </div>
        </AppLayout>
    );
};

export default TenantsPage;