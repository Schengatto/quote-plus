import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { BrandApiModel } from "@/types/api/brands";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Brand } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete, MdEdit } from "react-icons/md";

const Brands = () => {

    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [isInputFormActive, setIsInputFormActive] = useState<boolean>(false);
    const [selectedBrand, setSelectedBrand] = useState<Partial<BrandApiModel> | null>(null);
    const [brands, setBrands] = useState<BrandApiModel[]>([]);

    const handleEdit = (event: any, _selectedBrand: Partial<Brand>) => {
        event.stopPropagation();
        setSelectedBrand(_selectedBrand);
        setIsInputFormActive(true);
    };

    const handleCreateNew = () => {
        setSelectedBrand({ name: "", createdById: user?.id });
        setIsInputFormActive(true);
    };

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSelectedBrand((prev) => ({ ...prev, name: e.target.value }));
    };

    const handleBack = () => {
        setSelectedBrand(null);
        setIsInputFormActive(false);
    };

    const handleDelete = async (event: any, brandId: number) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteBrand(brandId), t)
            .then(content => setDialog(content));
    };

    const deleteBrand = async (brandId: number) => {
        setDialog(null);
        await doActionWithLoader(setIsLoading, () => fetch(`/api/brands/${brandId}`, { method: "DELETE" }));

        if (selectedBrand?.id === brandId) {
            setIsInputFormActive(false);
            setSelectedBrand(null);
        }
        await fetchBrands();
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedBrand?.name) return;

        const method = selectedBrand.id ? "PATCH" : "POST";
        const endpoint = selectedBrand.id ? `/api/brands/${selectedBrand.id}` : "/api/brands";

        await doActionWithLoader(
            setIsLoading,
            async () => {
                const response = await fetch(endpoint, { method: method, body: JSON.stringify({ ...selectedBrand, products: undefined }) })
                    .then((res) => res.json());

                if (!response.id) {
                    alert(`${t("common.error.onSave")}, ${response.message}`);
                }
            },
            (error: any) => alert(`${t("common.error.onSave")}, ${error.message}`)
        );

        await fetchBrands();
        setIsInputFormActive(false);
    };

    const fetchBrands = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _brands = await fetch("/api/brands", { method: "GET" })
                .then((res) => res.json());
            setBrands(_brands);
        });
    }, [setIsLoading]);

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("brands")) {
            router.push("/");
            return;
        }

        fetchBrands();
    }, [user, router, fetchBrands]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="flex text-xl font-semibold text-gray-800 border-b pb-2 mb-4 ">
                    <span className="capitalize">{t("brands.table.title")}</span>
                </div>
                {!isInputFormActive ?
                    <div className="flex item-center justify-end w-full my-4">
                        <button
                            className="btn-primary"
                            onClick={handleCreateNew}>
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className="uppercase font-bold text-sm">{t("brands.button.addBrand")}</div>
                        </button>
                    </div>
                    :
                    <div className="my-4">
                        <div className="card">
                            <div className="font-semibold first-letter:capitalize">
                                {selectedBrand?.id
                                    ? <><span className="mr-1">{t("common.edit")}:</span>{brands.find(b => b.id === selectedBrand.id)?.name}</>
                                    : t("brands.button.addBrand")
                                }
                            </div>
                            <div className="card-body">
                                <form className="w-full" onSubmit={handleSave}>
                                    <div className="w-full my-4">
                                        <div className="field-label">{t("brands.form.name")}</div>
                                        <input
                                            type="text"
                                            value={selectedBrand?.name}
                                            required
                                            className="text-input"
                                            onChange={handleNameChanged} />
                                    </div>

                                    {!!selectedBrand?.products?.length &&
                                        <div className="uppercase py-4 text-center border-4 bg-yellow-200 border-yellow-500 my-4">
                                            <strong>{t("brands.warning.deleteDisabled")}</strong>
                                        </div>
                                    }

                                    <div className="flex justify-center items-center gap-2 flex-wrap">

                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handleBack}>
                                            <div className="uppercase font-bold text-sm">{t("common.back")}</div>
                                        </button>

                                        {selectedBrand?.id
                                            && <button
                                                type="button"
                                                className="btn-danger"
                                                disabled={!!selectedBrand.products?.length}
                                                onClick={(e) => handleDelete(e, selectedBrand.id!)}>
                                                <div className="uppercase font-bold text-sm">{t("common.delete")}</div>
                                            </button>
                                        }

                                        <button
                                            type="submit"
                                            disabled={!selectedBrand?.name}
                                            className="btn-primary">
                                            <div className="uppercase font-bold text-sm">{t("common.save")}</div>
                                        </button>

                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                }

                <table className="items-table">
                    <tbody>
                        {brands.map((b: BrandApiModel) =>
                            <tr key={b.id} className={`table-row ${b.id === selectedBrand?.id && "!table-row-active"}`} onClick={(e) => handleEdit(e, b)}>
                                <td className={"mx-2 text-sm font-bold p-3 w-auto truncate max-w-0"}>{b.name}</td>
                                <td className="w-10 cursor-pointer" onClick={(e) => handleEdit(e, b)}>
                                    <div>
                                        <MdEdit />
                                    </div>
                                </td>
                                <td className="w-10">
                                    <button className="disabled:opacity-50 text-red-600"
                                        disabled={b.products?.length > 0}
                                        onClick={(e) => handleDelete(e, b.id)}>
                                        <MdDelete />
                                    </button></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </AppLayout>
    );
};

export default Brands;