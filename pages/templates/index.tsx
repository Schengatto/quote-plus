import TextEditor from "@/components/TextEditor";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Template } from "@prisma/client";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete, MdEdit } from "react-icons/md";

const Templates = () => {

    const auth = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [ isInputFormActive, setIsInputFormActive ] = useState<boolean>(false);
    const [ selectedTemplate, setSelectedTemplate ] = useState<Partial<Template> | null>(null);
    const [ templates, setTemplates ] = useState<Template[]>([]);

    const handleEdit = (event: any, _selectedTemplate: Partial<Template>) => {
        event.stopPropagation();
        setSelectedTemplate(_selectedTemplate);
        setIsInputFormActive(true);
    };

    const handleCreateNew = () => {
        if (!auth) return;
        setSelectedTemplate({ name: "", content: "", createdById: auth.id });
        setIsInputFormActive(true);
    };

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSelectedTemplate((prev) => ({ ...prev, name: e.target.value }));
    };

    const handleContentChanged = (value: string) => {
        setSelectedTemplate((prev) => ({ ...prev, content: value }));
    };

    const handleBack = () => {
        setSelectedTemplate(null);
        setIsInputFormActive(false);
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedTemplate === null || !selectedTemplate.name) return;

        try {
            const method = selectedTemplate.id ? "PATCH" : "POST";
            const endpoint = selectedTemplate.id ? `/api/templates/${selectedTemplate.id}` : "/api/templates";
            const response = await fetch(endpoint, { method: method, body: JSON.stringify(selectedTemplate) })
                .then((res) => res.json());

            if (!response.id) {
                alert(`${t("common.error.onSave")}, ${response.message}`);
            }
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
        await fetchTemplates();
        setIsInputFormActive(false);
    };

    const handleDelete = async (event: any, template: Template) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteTemplate(template), t)
            .then(content => setDialog(content));
    };

    const deleteTemplate = async (template: Template) => {
        setDialog(null);
        await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
        await fetchTemplates();
    };

    const fetchTemplates = async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _templates = await fetch(`/api/templates?userId=${auth?.id}`, { method: "GET" })
                .then((res) => res.json());
            setTemplates(_templates);
        });
    };

    useEffect(() => {
        if (!auth) return;
        fetchTemplates();
    }, [ auth ]);

    return (
        <AppLayout>
            <div className="m-8">
                <table className="items-table">
                    <thead className="table-header">
                        <tr>
                            <th colSpan={3} className="text-white uppercase p-2 text-lg">{t("templates.table.title")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.map((b: Template) =>
                            <tr key={b.id} className={`table-row ${b.id === selectedTemplate?.id && "!table-row-active"}`} onClick={(e) => handleEdit(e, b)}>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{b.name}</td>
                                <td className="w-10 cursor-pointer " onClick={(e) => handleEdit(e, b)}><div><MdEdit /></div></td>
                                <td className="w-10 cursor-pointer text-red-600" onClick={(e) => handleDelete(e, b)}><MdDelete /></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {!isInputFormActive
                ?
                <div className="flex item-center justify-center w-full">
                    <button
                        className="btn-primary"
                        onClick={handleCreateNew}>
                        <div>
                            <MdAddCircleOutline />
                        </div>
                        <div className="uppercase font-bold text-lg">{t("templates.button.addTemplate")}</div>
                    </button>
                </div>
                :
                <div className="m-8">
                    <div className="card-header">{t("templates.form.title")}</div>
                    <div className="card-body">
                        <form className="w-[90%]" onSubmit={handleSave}>
                            <div className="w-full my-4">
                                <div className="font-extrabold text-lg uppercase">{t("templates.form.name")}</div>
                                <input
                                    type="text"
                                    value={selectedTemplate?.name}
                                    className="text-input"
                                    onChange={handleNameChanged} />
                            </div>
                            <div className='w-full my-4'>
                                <div className='font-extrabold text-lg uppercase'>{t("templates.form.content")}</div>
                                <div className="bg-white">
                                    <TextEditor initialValue={selectedTemplate?.content} onChange={handleContentChanged} />
                                </div>
                            </div>
                            <div className="flex justify-center items-center gap-2 flex-wrap">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleBack}>
                                    <div className="uppercase font-bold text-lg">{t("common.back")}</div>
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary">
                                    <div className="uppercase font-bold text-lg">{t("templates.button.save")}</div>
                                </button>

                            </div>
                        </form>
                    </div>
                </div>}
        </AppLayout>
    );
};

export default Templates;