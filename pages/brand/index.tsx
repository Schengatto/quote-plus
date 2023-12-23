import { Brand } from "@prisma/client";
import AppLayout from "@/layouts/Layout";
import { MdEdit, MdDelete, MdAddCircleOutline } from "react-icons/md";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useI18nStore } from "@/store/i18n";
import { useAuthStore } from "@/store/auth";
import { useAppStore } from "@/store/app";
import { doActionWithLoader } from "@/utils/actions";
import { BrandApiModel } from "@/types/api/brand";

const Brands = () => {

    const { t } = useI18nStore();
    const { user } = useAuthStore();
    const { setIsLoading } = useAppStore();

    const [ isInputFormActive, setIsInputFormActive ] = useState<boolean>(false);
    const [ selectedBrand, setSelectedBrand ] = useState<Partial<BrandApiModel> | null>(null);
    const [ brands, setBrands ] = useState<BrandApiModel[]>([]);

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
        await doActionWithLoader(setIsLoading, () => fetch(`/api/brand/${brandId}`, { method: "DELETE" }));
        await fetchBrands();
        if (selectedBrand?.id === brandId) {
            setIsInputFormActive(false);
            setSelectedBrand(null);
        }
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedBrand === null || !selectedBrand.name) return;

        const method = selectedBrand.id ? "PATCH" : "POST";
        const endpoint = selectedBrand.id ? `/api/brand/${selectedBrand.id}` : "/api/brand";

        await doActionWithLoader(
            setIsLoading,
            async () => {
                const response = await fetch(endpoint, { method: method, body: JSON.stringify({ ...selectedBrand, products: undefined }) })
                    .then((res) => res.json());

                if (!response.id) {
                    alert(`Qualcosa è andato storto durante il salvataggio, ${response.message}`);
                }
            },
            (error: any) => alert(`Qualcosa è andato storto durante il salvataggio, ${error.message}`)
        );

        await fetchBrands();
        setIsInputFormActive(false);
    };

    const fetchBrands = async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _brands = await fetch("/api/brand", { method: "GET" })
                .then((res) => res.json());
            setBrands(_brands);
        });
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    return (
        <AppLayout>
            <div className="m-8">
                <table className="items-table">
                    <thead className="bg-gray-900">
                        <tr>
                            <th colSpan={3} className="text-white uppercase p-2 text-lg">{t("brands.table.title")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.map((b: BrandApiModel) =>
                            <tr key={b.id} className={`table-row ${b.id === selectedBrand?.id && "!table-row-active"}`} onClick={(e) => handleEdit(e, b)}>
                                <td className={"mx-2 text-lg font-bold p-3 w-auto truncate max-w-0"}>{b.name}</td>
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

            {!isInputFormActive ?
                <div className="flex item-center justify-center w-full">
                    <button
                        className="btn-primary rounded-full"
                        onClick={handleCreateNew}>
                        <div>
                            <MdAddCircleOutline />
                        </div>
                        <div className="uppercase font-bold text-lg">{t("brands.button.addBrand")}</div>
                    </button>
                </div>
                :
                <div className="m-8 card">
                    <div className="card-header">
                        {selectedBrand?.id
                            ? brands.find(b => b.id === selectedBrand.id)?.name
                            : t("brands.form.title")
                        }
                    </div>
                    <div className="card-body">
                        <form className="w-[90%]" onSubmit={handleSave}>
                            <div className="w-full my-4">
                                <div className="font-extrabold text-lg uppercase">{t("brands.form.name")}</div>
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
                                    <div className="uppercase font-bold text-lg">{t("common.back")}</div>
                                </button>

                                {selectedBrand?.id
                  && <button
                      type="button"
                      className="btn-danger"
                      disabled={!!selectedBrand.products?.length}
                      onClick={(e) => handleDelete(e, selectedBrand.id!)}>
                      <div className="uppercase font-bold text-lg">{t("common.delete")}</div>
                  </button>
                                }

                                <button
                                    type="submit"
                                    disabled={!selectedBrand?.name}
                                    className="btn-primary">
                                    <div className="uppercase font-bold text-lg">{t("common.save")}</div>
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            }

        </AppLayout>
    );
};

export default Brands;