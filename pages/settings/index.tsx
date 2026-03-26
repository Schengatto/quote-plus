import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { TenantPlaceholders } from "@/types/tenants";
import { doActionWithLoader } from "@/utils/actions";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MdDownload, MdFileDownload, MdFileUpload, MdOutlineSave } from "react-icons/md";

const defaultTenantPlaceholders = {
    products: "{{products}}",
    price: "{{price}}",
    currency: "{{currency}}",
    "discounted-price": "{{discounted-price}}"
};

const TenantsPage = () => {

    const { userData } = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();

    const [ tenantId, setTenantId ] = useState<String>();
    const [ placeholders, setPlaceholders ] = useState<TenantPlaceholders>(defaultTenantPlaceholders);

    // Product import/export state
    const fileInputProductsRef = useRef<HTMLInputElement>(null);
    const [ importPreview, setImportPreview ] = useState<any>(null);
    const [ importCsvData, setImportCsvData ] = useState<string | null>(null);
    const [ importResult, setImportResult ] = useState<any>(null);

    // Contact import/export state
    const fileInputContactsRef = useRef<HTMLInputElement>(null);
    const [ contactImportPreview, setContactImportPreview ] = useState<any>(null);
    const [ contactImportCsvData, setContactImportCsvData ] = useState<string | null>(null);
    const [ contactImportResult, setContactImportResult ] = useState<any>(null);

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

    // --- Product CSV Full Export/Import ---
    const handleExportProductsFull = () => {
        window.open("/api/products/export-csv-full", "_blank");
    };

    const handleImportProductsClick = () => {
        setImportPreview(null);
        setImportResult(null);
        fileInputProductsRef.current?.click();
    };

    const handleProductsFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setImportCsvData(text);

        await doActionWithLoader(setIsLoading, async () => {
            const response = await fetch("/api/products/import-csv-full", {
                method: "POST",
                body: JSON.stringify({ csv: text, mode: "validate" }),
            }).then((res) => res.json());

            setImportPreview(response);
            setImportResult(null);
        }, (error) => alert(error.message));

        if (fileInputProductsRef.current) {
            fileInputProductsRef.current.value = "";
        }
    };

    const handleConfirmImport = async () => {
        if (!importCsvData) return;

        await doActionWithLoader(setIsLoading, async () => {
            const response = await fetch("/api/products/import-csv-full", {
                method: "POST",
                body: JSON.stringify({
                    csv: importCsvData,
                    mode: "execute",
                    createdById: userData?.id || 0,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Errore durante l'importazione");
            }

            setImportResult(data);
            setImportPreview(null);
            setImportCsvData(null);
        }, (error) => alert(error.message));
    };

    const handleCancelImport = () => {
        setImportPreview(null);
        setImportCsvData(null);
        setImportResult(null);
    };

    // --- Contact CSV Full Export/Import ---
    const handleExportContactsFull = () => {
        window.open("/api/contacts/export-csv-full", "_blank");
    };

    const handleImportContactsClick = () => {
        setContactImportPreview(null);
        setContactImportResult(null);
        fileInputContactsRef.current?.click();
    };

    const handleContactsFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setContactImportCsvData(text);

        await doActionWithLoader(setIsLoading, async () => {
            const response = await fetch("/api/contacts/import-csv-full", {
                method: "POST",
                body: JSON.stringify({ csv: text, mode: "validate" }),
            }).then((res) => res.json());

            setContactImportPreview(response);
            setContactImportResult(null);
        }, (error) => alert(error.message));

        if (fileInputContactsRef.current) {
            fileInputContactsRef.current.value = "";
        }
    };

    const handleConfirmContactImport = async () => {
        if (!contactImportCsvData) return;

        await doActionWithLoader(setIsLoading, async () => {
            const response = await fetch("/api/contacts/import-csv-full", {
                method: "POST",
                body: JSON.stringify({
                    csv: contactImportCsvData,
                    mode: "execute",
                    createdBy: userData?.username || "system",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Errore durante l'importazione");
            }

            setContactImportResult(data);
            setContactImportPreview(null);
            setContactImportCsvData(null);
        }, (error) => alert(error.message));
    };

    const handleCancelContactImport = () => {
        setContactImportPreview(null);
        setContactImportCsvData(null);
        setContactImportResult(null);
    };

    const fetchTenant = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _tenant = await fetch(`/api/tenants/${userData?.tenantId}`, { method: "GET" })
                .then((res) => res.json());
            setTenantId(_tenant.id);
            setPlaceholders(_tenant.placeholders);
        });
    }, [ userData, setIsLoading ]);

    useEffect(() => {
        if (!userData) return;
        fetchTenant();
    }, [ userData, fetchTenant ]);

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
                                    <div className="uppercase text-sm">{t("common.save")}</div>
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
                        <div className="uppercase text-sm">{t("settings.button.downloadQuotesBackup")}</div>
                    </button>
                </div>
            </div>

            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("settings.productsImportExport.title")}</span>
                </div>

                <input
                    ref={fileInputProductsRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleProductsFileSelected}
                />

                <div className="flex items-start gap-4">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleExportProductsFull}>
                        <div><MdFileDownload /></div>
                        <div className="uppercase text-sm">{t("settings.productsImportExport.export")}</div>
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleImportProductsClick}>
                        <div><MdFileUpload /></div>
                        <div className="uppercase text-sm">{t("settings.productsImportExport.import")}</div>
                    </button>
                </div>

                {importPreview && (
                    <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50">
                        <h3 className="font-bold text-lg mb-3">{t("settings.productsImportExport.preview")}</h3>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <div>{t("settings.productsImportExport.totalRows")}: <strong>{importPreview.totalRows}</strong></div>
                            <div>{t("settings.productsImportExport.toCreate")}: <strong>{importPreview.toCreate}</strong></div>
                            <div>{t("settings.productsImportExport.toUpdate")}: <strong>{importPreview.toUpdate}</strong></div>
                        </div>

                        {importPreview.newBrands?.length > 0 && (
                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                <strong>{t("settings.productsImportExport.newBrands")}:</strong>{" "}
                                {importPreview.newBrands.join(", ")}
                            </div>
                        )}

                        {importPreview.newCategories?.length > 0 && (
                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                <strong>{t("settings.productsImportExport.newCategories")}:</strong>{" "}
                                {importPreview.newCategories.join(", ")}
                            </div>
                        )}

                        {importPreview.errors?.length > 0 && (
                            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <strong>{t("settings.productsImportExport.errors")}:</strong>
                                <ul className="list-disc list-inside mt-1">
                                    {importPreview.errors.map((err: string, i: number) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-3 mt-4">
                            {importPreview.valid && (
                                <button
                                    type="button"
                                    className="btn-primary bg-green-600 hover:bg-green-700"
                                    onClick={handleConfirmImport}>
                                    <div className="uppercase text-sm">{t("settings.productsImportExport.confirmImport")}</div>
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn-primary bg-red-600 hover:bg-red-700"
                                onClick={handleCancelImport}>
                                <div className="uppercase text-sm">{t("common.cancel")}</div>
                            </button>
                        </div>
                    </div>
                )}

                {importResult && (
                    <div className="mt-4 p-4 border border-green-300 rounded bg-green-50 text-sm">
                        <strong>{t("settings.productsImportExport.importDone")}</strong>
                        <div className="mt-1">
                            {importResult.created > 0 && <div>{t("settings.productsImportExport.created")}: {importResult.created}</div>}
                            {importResult.updated > 0 && <div>{t("settings.productsImportExport.updated")}: {importResult.updated}</div>}
                            {importResult.newBrands?.length > 0 && <div>{t("settings.productsImportExport.newBrandsCreated")}: {importResult.newBrands.join(", ")}</div>}
                            {importResult.newCategories?.length > 0 && (
                                <div>{t("settings.productsImportExport.newCategoriesCreated")}: {importResult.newCategories.join(", ")}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("settings.contactsImportExport.title")}</span>
                </div>

                <input
                    ref={fileInputContactsRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleContactsFileSelected}
                />

                <div className="flex items-start gap-4">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleExportContactsFull}>
                        <div><MdFileDownload /></div>
                        <div className="uppercase text-sm">{t("settings.contactsImportExport.export")}</div>
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleImportContactsClick}>
                        <div><MdFileUpload /></div>
                        <div className="uppercase text-sm">{t("settings.contactsImportExport.import")}</div>
                    </button>
                </div>

                {contactImportPreview && (
                    <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50">
                        <h3 className="font-bold text-lg mb-3">{t("settings.contactsImportExport.preview")}</h3>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <div>{t("settings.contactsImportExport.totalRows")}: <strong>{contactImportPreview.totalRows}</strong></div>
                            <div>{t("settings.contactsImportExport.toCreate")}: <strong>{contactImportPreview.toCreate}</strong></div>
                            <div>{t("settings.contactsImportExport.toUpdate")}: <strong>{contactImportPreview.toUpdate}</strong></div>
                        </div>

                        {contactImportPreview.newGroups?.length > 0 && (
                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                <strong>{t("settings.contactsImportExport.newGroups")}:</strong>{" "}
                                {contactImportPreview.newGroups.join(", ")}
                            </div>
                        )}

                        {contactImportPreview.errors?.length > 0 && (
                            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <strong>{t("settings.contactsImportExport.errors")}:</strong>
                                <ul className="list-disc list-inside mt-1">
                                    {contactImportPreview.errors.map((err: string, i: number) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-3 mt-4">
                            {contactImportPreview.valid && (
                                <button
                                    type="button"
                                    className="btn-primary bg-green-600 hover:bg-green-700"
                                    onClick={handleConfirmContactImport}>
                                    <div className="uppercase text-sm">{t("settings.contactsImportExport.confirmImport")}</div>
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn-primary bg-red-600 hover:bg-red-700"
                                onClick={handleCancelContactImport}>
                                <div className="uppercase text-sm">{t("common.cancel")}</div>
                            </button>
                        </div>
                    </div>
                )}

                {contactImportResult && (
                    <div className="mt-4 p-4 border border-green-300 rounded bg-green-50 text-sm">
                        <strong>{t("settings.contactsImportExport.importDone")}</strong>
                        <div className="mt-1">
                            {contactImportResult.created > 0 && <div>{t("settings.contactsImportExport.created")}: {contactImportResult.created}</div>}
                            {contactImportResult.updated > 0 && <div>{t("settings.contactsImportExport.updated")}: {contactImportResult.updated}</div>}
                            {contactImportResult.groupsCreated > 0 && <div>{t("settings.contactsImportExport.groupsCreated")}: {contactImportResult.groupsCreated}</div>}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default TenantsPage;