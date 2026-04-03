import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { ContactGroup } from "@prisma/client";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { MdArrowBack, MdDelete, MdEdit, MdSave, MdClose } from "react-icons/md";

type ContactGroupWithCount = ContactGroup & { contacts: { id: number }[] };

const ContactGroups = () => {
    const router = useRouter();
    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [groups, setGroups] = useState<ContactGroupWithCount[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    const fetchGroups = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const data = await fetch("/api/contact-groups", { method: "GET" }).then((res) => res.json());
            setGroups(data);
        });
    }, [setIsLoading]);

    const handleDelete = async (event: any, group: ContactGroupWithCount) => {
        event.stopPropagation();
        const contactCount = group.contacts?.length || 0;
        const message = contactCount > 0
            ? `${t("contactGroups.confirmDelete.message")} ${contactCount} ${t("contactGroups.confirmDelete.contactsWillBeUnlinked")}`
            : t("common.confirmDelete.message");

        const dialogContent = {
            type: "warning",
            title: t("common.confirmAction"),
            message,
            closeActionLabel: t("common.cancel"),
            actions: [
                {
                    name: t("common.confirm"),
                    callback: async () => {
                        setDialog(null);
                        await doActionWithLoader(setIsLoading,
                            () => fetch(`/api/contact-groups/${group.id}`, { method: "DELETE" }),
                            (error) => alert(error.message)
                        );
                        await fetchGroups();
                    },
                },
            ],
        };
        setDialog(dialogContent);
    };

    const handleStartEdit = (event: any, group: ContactGroupWithCount) => {
        event.stopPropagation();
        setEditingId(group.id);
        setEditName(group.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName("");
    };

    const handleSaveEdit = async (event: any, group: ContactGroupWithCount) => {
        event.stopPropagation();
        if (!editName.trim()) return;

        await doActionWithLoader(setIsLoading, async () => {
            await fetch(`/api/contact-groups/${group.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName }),
            });
            setEditingId(null);
            setEditName("");
            await fetchGroups();
        });
    };

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("contactGroups.title")}</span>
                </div>

                <div className="my-4">
                    <div className="flex justify-end content-end w-full">
                        <button
                            className="btn-primary"
                            onClick={() => router.push("/contacts")}>
                            <div>
                                <MdArrowBack />
                            </div>
                            <div className="uppercase text-sm">{t("common.back")}</div>
                        </button>
                    </div>
                </div>

                <table className="min-w-full text-sm border rounded-md shadow-sm overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">{t("contactGroups.table.name")}</th>
                            <th className="px-4 py-3 text-left">{t("contactGroups.table.company")}</th>
                            <th className="px-4 py-3 text-center">{t("contactGroups.table.contactCount")}</th>
                            <th className="px-4 py-3 text-center">{t("contactGroups.table.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {groups.map((g) =>
                            <tr key={g.id} className="table-row">
                                <td className="text-sm px-4 py-3 w-auto truncate max-w-0">
                                    {editingId === g.id ? (
                                        <input
                                            type="text"
                                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveEdit(e, g);
                                                if (e.key === "Escape") handleCancelEdit();
                                            }}
                                            autoFocus
                                        />
                                    ) : g.name}
                                </td>
                                <td className="text-sm px-4 py-3 w-auto truncate max-w-0">{g.company ?? ""}</td>
                                <td className="text-sm px-4 py-3 text-center">{g.contacts?.length ?? 0}</td>
                                <td className="px-2 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        {editingId === g.id ? (
                                            <>
                                                <button
                                                    className="text-green-600 hover:text-green-800"
                                                    onClick={(e) => handleSaveEdit(e, g)}
                                                    title={t("common.save")}
                                                >
                                                    <MdSave />
                                                </button>
                                                <button
                                                    className="text-gray-600 hover:text-gray-800"
                                                    onClick={handleCancelEdit}
                                                    title={t("common.cancel")}
                                                >
                                                    <MdClose />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="text-blue-600 hover:text-blue-800"
                                                    onClick={(e) => handleStartEdit(e, g)}
                                                    title={t("common.edit")}
                                                >
                                                    <MdEdit />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-800"
                                                    onClick={(e) => handleDelete(e, g)}
                                                    title={t("common.delete")}
                                                >
                                                    <MdDelete />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default ContactGroups;
