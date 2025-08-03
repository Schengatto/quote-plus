import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useContactsStore } from "@/store/contacts";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Contact } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete, MdSearch } from "react-icons/md";

const Contacts = () => {

    const router = useRouter();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();
    const { contacts, selectedContact, setSelectedContact } = useContactsStore();

    const { setContacts } = useContactsStore();

    const [searchTerm, setSearchTerm] = useState<string>("");

    const handleEdit = (event: any, _selectedContact: Partial<Contact>) => {
        event.stopPropagation();
        router.push(`/contacts/${_selectedContact.id}`);
    };

    const handleDelete = async (event: any, contact: Partial<Contact>) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteProduct(contact), t)
            .then(content => setDialog(content));
    };

    const handleCreateNew = () => {
        router.push("/contacts/create");
    };

    const fetchContacts = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _contacts = await fetch("/api/contacts", { method: "GET" }).then((res) => res.json());
            setContacts(_contacts);
        });
    }, [setIsLoading]);

    const deleteProduct = async (contact: Partial<Contact>) => {
        setDialog(null);
        await doActionWithLoader(setIsLoading,
            () => fetch(`/api/contacts/${contact.id}`, { method: "DELETE" }),
            (error) => alert(error.message)
        );
        await fetchContacts();
    };

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSearchTerm(e.target.value.toLowerCase());
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("sideMenu.item.contactsList")}</span>
                </div>


                <div className="my-4">
                    <div className="flex justify-end content-end w-full">
                        <button
                            className="btn-primary"
                            onClick={handleCreateNew}>
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className="uppercase font-bold text-sm">{t("contacts.button.addContact")}</div>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full mx-auto border border-gray-300 px-4 py-2 bg-gray-50 shadow-sm">
                    <MdSearch className="text-gray-500 text-xl" />
                    <input
                        required
                        type="text"
                        className="w-full bg-transparent focus:outline-none text-sm placeholder-gray-400"
                        placeholder="Cerca contatto"
                        onChange={handleSearch}
                    />
                </div>
                <table className="min-w-full text-sm border rounded-md shadow-sm overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">{t("contacts.table.head.firstName")}</th>
                            <th className="px-4 py-3 text-left">{t("contacts.table.head.lastName")}</th>
                            <th className="px-4 py-3 text-left">{t("contacts.table.head.phoneNumber")}</th>
                            <th className="px-4 py-3 text-left">{t("contacts.table.head.email")}</th>
                            <th className="px-4 py-3 text-center">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {contacts
                            .filter(c => c.firstName?.toLowerCase()?.includes(searchTerm) || c.phoneNumber?.includes(searchTerm))
                            .map((c: Contact) =>
                                <tr key={c.id} className={`table-row ${c.id === selectedContact?.id && "!table-row-active"}`} onClick={(e) => handleEdit(e, c)}>
                                    <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{c.firstName}</td>
                                    <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{c.lastName}</td>
                                    <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{c.phoneNumber}</td>
                                    <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{c.email}</td>
                                    <td className="px-2 py-3 text-center">
                                        <button
                                            className="text-red-600 hover:text-red-800"
                                            onClick={(e) => handleDelete(e, c)}
                                        >
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default Contacts;
