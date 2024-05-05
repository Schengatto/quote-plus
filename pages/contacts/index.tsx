import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useContactsStore } from "@/store/contacts";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Contact } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";

interface ContactData {
    name: string;
    value: any;
}

const Contacts = () => {

    const router = useRouter();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();
    const { contacts, selectedContact, setSelectedContact } = useContactsStore();

    const { setContacts } = useContactsStore();

    const [ searchTerm, setSearchTerm ] = useState<string>("");

    const handleEdit = (event: any, _selectedContact: Partial<Contact>) => {
        event.stopPropagation();
        router.push(`/contacts/${_selectedContact.id}`);
    };

    const handleDelete = async (event: any, contact: Partial<Contact>) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteProduct(contact), t)
            .then(content => setDialog(content));
    };

    const fetchContacts = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _contacts = await fetch("/api/contacts", { method: "GET" }).then((res) => res.json());
            setContacts(_contacts);
        });
    }, [ setIsLoading ]);

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
            <div className="m-8">
                <table className="items-table">
                    <thead className="table-header">
                        <tr>
                            <th colSpan={3} className="text-white uppercase p-2 text-lg text-left">{t("contacts.table.title")}</th>
                            <th colSpan={2}>
                                <input
                                    required
                                    type="text"
                                    className="text-input"
                                    placeholder="search contact"
                                    onChange={handleSearch} />
                            </th>
                        </tr>
                        <tr className="bg-gray-700 border-2 border-gray-700">
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("contacts.table.head.firstName")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("contacts.table.head.lastName")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("contacts.table.head.phoneNumber")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("contacts.table.head.email")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts
                            .filter(c => c.firstName?.toLowerCase()?.includes(searchTerm) || c.phoneNumber?.includes(searchTerm))
                            .map((c: Contact) =>
                                <tr key={c.id} className={`table-row ${c.id === selectedContact?.id && "!table-row-active"}`} onClick={(e) => handleEdit(e, c)}>
                                    <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{c.firstName}</td>
                                    <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{c.lastName}</td>
                                    <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{c.phoneNumber}</td>
                                    <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{c.email}</td>
                                    <td className="w-10 cursor-pointer text-red-600" onClick={(event) => handleDelete(event, c)}><MdDelete /></td>
                                </tr>
                            )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default Contacts;
