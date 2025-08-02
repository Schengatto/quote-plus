import { Category } from "@prisma/client";
import AppLayout from "@/layouts/Layout";
import { MdEdit, MdDelete, MdAddCircleOutline } from "react-icons/md";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { CategoryApiModel } from "@/types/api/categories";
import { useI18nStore } from "@/store/i18n";
import { useAppStore } from "@/store/app";
import { doActionWithLoader } from "@/utils/actions";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { genericDeleteItemsDialog } from "@/utils/dialog";

const Categories = () => {
    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [isInputFormActive, setIsInputFormActive] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<Partial<CategoryApiModel>>({});
    const [categories, setCategories] = useState<CategoryApiModel[]>([]);
    const [availableParentCategories, setAvailableParentCategories] = useState<Category[]>([]);

    const handleEdit = (event: any, _selectedCategory: Partial<Category>) => {
        event.stopPropagation();
        setSelectedCategory(_selectedCategory);
        setIsInputFormActive(true);
    };

    const handleCreateNew = () => {
        setSelectedCategory({ name: "", createdById: 1, parentId: undefined });
        setIsInputFormActive(true);
    };

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSelectedCategory((prev: Partial<Category>) => ({ ...prev, name: e.target.value }));
    };

    const handleParentChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault();
        const parentId: number | null = !!e.currentTarget.value ? Number(e.currentTarget.value) : null;
        setSelectedCategory((prev: Partial<Category>) => ({ ...prev, parentId: parentId }));
    };

    const handleBack = () => {
        setSelectedCategory({});
        setIsInputFormActive(false);
    };

    const handleDelete = async (event: any, categoryId: number) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteCategory(categoryId), t)
            .then(content => setDialog(content));
    };

    const deleteCategory = async (categoryId: number) => {
        setDialog(null);
        await doActionWithLoader(setIsLoading, () => fetch(`/api/categories/${categoryId}`, { method: "DELETE" }), (error) => alert(error));
        await fetchCategories();
        if (selectedCategory?.id === categoryId) {
            setIsInputFormActive(false);
            setSelectedCategory({});
        }
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedCategory === null || !selectedCategory.name) return;

        const method = selectedCategory.id ? "PATCH" : "POST";
        const endpoint = selectedCategory.id ? `/api/categories/${selectedCategory.id}` : "/api/categories";
        const body = {
            id: selectedCategory.id,
            name: selectedCategory.name,
            parentId: selectedCategory.parentId || null,
            createdById: selectedCategory.createdById ?? 0
        };

        await doActionWithLoader(
            setIsLoading,
            async () => {
                const response = await fetch(endpoint, { method: method, body: JSON.stringify(body) })
                    .then((res) => res.json());

                if (!response.id) {
                    alert(`${t("common.error.onSave")}, ${response.message}`);
                }
            },
            (error: any) => alert(`${t("common.error.onSave")}, ${error.message}`)
        );
        await fetchCategories();
        setIsInputFormActive(false);
    };

    const fetchCategories = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _categories = await fetch("/api/categories", { method: "GET" }).then((res) => res.json());
            setCategories(_categories);
        });
    }, [setIsLoading]);

    const categoryLabel = (category: CategoryApiModel): string => {
        return category.parent
            ? `${category.parent.name} » ${category.name}`
            : category.name;
    };

    useEffect(() => {
        if (!user) return;
        if (!user?.userRole.grants?.includes("categories")) {
            router.push("/");
            return;
        }

        fetchCategories();
    }, [router, user, fetchCategories]);

    useEffect(() => {
        const notTheSelectedOne = ((c: Category) => c.id !== selectedCategory?.id);
        const isNotChildCategory = ((c: Category) => !c.parentId);
        const _availableCategories = categories.filter(c => notTheSelectedOne(c) && isNotChildCategory(c));
        setAvailableParentCategories(_availableCategories);
    }, [selectedCategory, categories]);

    return (
        <AppLayout>
            <div className='m-8'>
                <div className="flex text-xl font-semibold text-gray-800 border-b pb-2 mb-4 ">
                    <span className="capitalize">{t("categories.table.title")}</span>
                </div>

                {!isInputFormActive ?
                    <div className='flex item-center justify-end w-full my-4'>
                        <button
                            className='btn-primary'
                            onClick={handleCreateNew}
                        >
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className='uppercase font-bold text-sm'>{t("categories.button.addCategory")}</div>
                        </button>
                    </div>
                    :
                    <div className="my-4">
                        <div className="card">
                            <div className="font-semibold first-letter:capitalize">
                                {selectedCategory?.id
                                    ? <><span className="mr-1">{t("common.edit")}:</span>{categories.find(b => b.id === selectedCategory.id)?.name}</>
                                    : t("categories.form.title")
                                }
                            </div>
                            <div className='card-body'>
                                <form className="w-full" onSubmit={handleSave}>
                                    <div className='w-full my-4'>
                                        <div className='field-label'>{t("categories.form.name")}</div>
                                        <input
                                            type='text'
                                            value={selectedCategory?.name}
                                            className='text-input'
                                            onChange={handleNameChanged}
                                        />
                                    </div>
                                    <div className='w-full my-4'>
                                        <div className='field-label'>{t("categories.form.parentName")}</div>
                                        <select className='text-input'
                                            value={selectedCategory?.parentId ? Number(selectedCategory.parentId) : undefined}
                                            disabled={!availableParentCategories.length}
                                            onChange={handleParentChanged} >
                                            <option value={undefined}></option>
                                            {availableParentCategories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                                        </select>
                                    </div>

                                    {!!selectedCategory?.products?.length &&
                                        <div className="uppercase py-4 text-center border-4 bg-yellow-200 border-yellow-500 my-4">
                                            <strong>{t("categories.warning.deleteDisabled")}</strong>
                                        </div>
                                    }

                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handleBack}>
                                            <div className="uppercase font-bold text-sm">{t("common.back")}</div>
                                        </button>

                                        {selectedCategory?.id
                                            && <button
                                                type="button"
                                                className="btn-danger"
                                                disabled={!!selectedCategory.products?.length}
                                                onClick={(e) => handleDelete(e, selectedCategory.id!)}>
                                                <div className="uppercase font-bold text-sm">{t("common.delete")}</div>
                                            </button>
                                        }

                                        <button
                                            type='submit'
                                            className='btn-primary'
                                        >
                                            <div className='uppercase font-bold text-sm'>{t("categories.button.save")}</div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                }
                <table className='items-table'>
                    <tbody>
                        {categories.map((c: Required<CategoryApiModel>) => (
                            <tr key={c.id} className={`table-row ${c.id === selectedCategory?.id && "!table-row-active"}`} onClick={(e) => handleEdit(e, c)}>
                                <td className='mx-2 text-sm font-bold p-3 w-auto truncate max-w-0'>{categoryLabel(c)}</td>
                                <td className='w-10 cursor-pointer' onClick={(e) => handleEdit(e, c)}>
                                    <button>
                                        <MdEdit />
                                    </button>
                                </td>
                                <td className='w-10 cursor-pointer'>
                                    <button className="disabled:opacity-50 text-red-600"
                                        disabled={c.products.length > 0}
                                        onClick={(e) => handleDelete(e, c.id)}>
                                        <MdDelete />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default Categories;
