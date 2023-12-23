import { Category } from "@prisma/client";
import AppLayout from "@/layouts/Layout";
import { MdEdit, MdDelete, MdAddCircleOutline } from "react-icons/md";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { CategoryApiModel } from "@/types/api/category";
import { useI18nStore } from "@/store/i18n";
import { useAppStore } from "@/store/app";
import { doActionWithLoader } from "@/utils/actions";

const Categories = () => {
    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();

    const [ isInputFormActive, setIsInputFormActive ] = useState<boolean>(false);
    const [ selectedCategory, setSelectedCategory ] = useState<Partial<CategoryApiModel> | null>(null);
    const [ categories, setCategories ] = useState<CategoryApiModel[]>([]);
    const [ availableParentCategories, setAvailableParentCategories ] = useState<Category[]>([]);

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
        setSelectedCategory((prev) => ({ ...prev, name: e.target.value }));
    };

    const handleParentChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault();
        const parentId: number | null = !!e.currentTarget.value ? Number(e.currentTarget.value) : null;
        setSelectedCategory((prev) => ({ ...prev, parentId: parentId }));
    };

    const handleBack = () => {
        setSelectedCategory(null);
        setIsInputFormActive(false);
    };

    const handleDelete = async (event: any, categoryId: number) => {
        event.stopPropagation();
        await doActionWithLoader(setIsLoading, () => fetch(`/api/category/${categoryId}`, { method: "DELETE" }), (error) => alert(error));
        await fetchCategories();
        if (selectedCategory?.id === categoryId) {
            setIsInputFormActive(false);
            setSelectedCategory(null);
        }
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedCategory === null || !selectedCategory.name) return;

        const method = selectedCategory.id ? "PATCH" : "POST";
        const endpoint = selectedCategory.id ? `/api/category/${selectedCategory.id}` : "/api/category";
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
                    alert(`Qualcosa è andato storto durante il salvataggio, ${response.message}`);
                }
            },
            (error: any) => alert(`Qualcosa è andato storto durante il salvataggio, ${error.message}`)
        );
        await fetchCategories();
        setIsInputFormActive(false);
    };

    const fetchCategories = async () => {
        doActionWithLoader(setIsLoading, async() => {
            const _categories = await fetch("/api/category", { method: "GET" }).then((res) => res.json());
            setCategories(_categories);
        });

    };

    const categoryLabel = (category: CategoryApiModel): string => {
        return category.parent
            ? `${category.parent.name} » ${category.name}`
            : category.name;
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const notTheSelectedOne = ((c: Category) => c.id !== selectedCategory?.id);
        const isNotChildCategory = ((c: Category) => !c.parentId);
        const _availableCategories = categories.filter(c => notTheSelectedOne(c) && isNotChildCategory(c));
        setAvailableParentCategories(_availableCategories);
    }, [ selectedCategory, categories ]);

    return (
        <AppLayout>
            <div className='m-8'>
                <table className='items-table'>
                    <thead className='bg-gray-900'>
                        <tr>
                            <th colSpan={3} className='text-white uppercase p-2 text-lg'>
                                {t("categories.table.title")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((c: Required<CategoryApiModel>) => (
                            <tr key={c.id} className={`table-row ${c.id === selectedCategory?.id && "!table-row-active"}`} onClick={(e) => handleEdit(e, c)}>
                                <td className='mx-2 text-lg font-bold p-3 w-auto truncate max-w-0'>{categoryLabel(c)}</td>
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

            {!isInputFormActive ?
                <div className='flex item-center justify-center w-full'>
                    <button
                        className='btn-primary'
                        onClick={handleCreateNew}
                    >
                        <div>
                            <MdAddCircleOutline />
                        </div>
                        <div className='uppercase font-bold text-lg'>{t("categories.button.addCategory")}</div>
                    </button>
                </div>
                :
                <div className='m-8'>
                    <div className='card-header'>
                        {selectedCategory?.id
                            ? categories.find(b => b.id === selectedCategory.id)?.name
                            : t("categories.form.title")
                        }
                    </div>
                    <div className='card-body'>
                        <form className="w-[90%]" onSubmit={handleSave}>
                            <div className='w-full my-4'>
                                <div className='font-extrabold text-lg uppercase'>{t("categories.form.name")}</div>
                                <input
                                    type='text'
                                    value={selectedCategory?.name}
                                    className='text-input'
                                    onChange={handleNameChanged}
                                />
                            </div>
                            <div className='w-full my-4'>
                                <div className='font-extrabold text-lg uppercase'>{t("categories.form.parentName")}</div>
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
                                    <div className="uppercase font-bold text-lg">{t("common.back")}</div>
                                </button>

                                {selectedCategory?.id
                                    && <button
                                        type="button"
                                        className="btn-danger"
                                        disabled={!!selectedCategory.products?.length}
                                        onClick={(e) => handleDelete(e, selectedCategory.id!)}>
                                        <div className="uppercase font-bold text-lg">{t("common.delete")}</div>
                                    </button>
                                }

                                <button
                                    type='submit'
                                    className='btn-primary'
                                >
                                    <div className='uppercase font-bold text-lg'>{t("categories.button.save")}</div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </AppLayout>
    );
};

export default Categories;
