import { Template } from "@prisma/client";
import AppLayout from "@/layouts/Layout";
import { MdEdit, MdDelete, MdAddCircleOutline } from "react-icons/md";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useI18nStore } from "@/store/i18n";
import { useAuthStore } from "@/store/auth";
import TextEditor from "@/components/TextEditor";
import { doActionWithLoader } from "@/utils/actions";
import { useAppStore } from "@/store/app";

const Templates = () => {

    const { t } = useI18nStore();
    const { user } = useAuthStore();
    const { setIsLoading } = useAppStore();

    const [ isInputFormActive, setIsInputFormActive ] = useState<boolean>(false);
    const [ selectedTemplate, setSelectedTemplate ] = useState<Partial<Template> | null>(null);
    const [ templates, setTemplates ] = useState<Template[]>([]);

    const handleEdit = (event: any, _selectedTemplate: Partial<Template>) => {
        event.stopPropagation();
        setSelectedTemplate(_selectedTemplate);
        setIsInputFormActive(true);
    };

    const handleCreateNew = () => {
        setSelectedTemplate({ name: "", content: "", createdById: user?.id });
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
            const endpoint = selectedTemplate.id ? `/api/template/${selectedTemplate.id}` : "/api/template";
            const response = await fetch(endpoint, { method: method, body: JSON.stringify(selectedTemplate) })
                .then((res) => res.json());

            if (!response.id) {
                alert(`Qualcosa è andato storto durante il salvataggio, ${response.message}`);
            }
        } catch (error: any) {
            alert(`Qualcosa è andato storto durante il salvataggio, ${error.message}`);
        }
        await fetchTemplates();
        setIsInputFormActive(false);
    };

    const handleDelete = async (event: any, template: Template) => {
        event.stopPropagation();
        await fetch(`/api/template/${template.id}`, { method: "DELETE" });
        await fetchTemplates();
    };

    const fetchTemplates = async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _templates = await fetch("/api/template", { method: "GET" })
                .then((res) => res.json());
            setTemplates(_templates);
        });
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    return (
        <AppLayout>
            <div className="m-8">
                <table className="items-table">
                    <thead className="bg-gray-900">
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