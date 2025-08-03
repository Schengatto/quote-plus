import ContactNoteMessage from "@/components/contacts/ContactNoteMessage";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { ContactNoteStatus } from "@/types/contacts";
import { doActionWithLoader } from "@/utils/actions";
import { Contact, ContactNote } from "@prisma/client";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

const EditContact = () => {

    const router = useRouter();
    const params = useParams();
    const user = useAuth();

    const { setIsLoading } = useAppStore();
    const { t } = useI18nStore();

    const defaultContact: Partial<Contact> = {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        mobile: "",
        business: "",
        businessFax: "",
        company: "",
        home: ""
    };

    const [selectedContact, setSelectedContact] = useState<Partial<Contact>>(defaultContact);
    const [notes, setNotes] = useState<ContactNote[]>([]);
    const [selectedNote, setSelectedNote] = useState<Partial<ContactNote>>({ status: "OPEN" });
    const [searchHistory, setSearchHistory] = useState<string>("");

    const fetchContactNotes = useCallback(async (contactId: number) => {
        doActionWithLoader(setIsLoading, async () => {
            const _contactsNotes = await fetch(`/api/contacts/${contactId}/notes`, { method: "GET" }).then((res) => res.json());
            setNotes(_contactsNotes);
        });
    }, [setIsLoading]);

    const handleFirstNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, firstName: e.target.value }));
    };

    const handleLastNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, lastName: e.target.value }));
    };

    const handleEmailChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, email: e.target.value }));
    };

    const handleHomeChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, home: e.target.value }));
    };

    const handleCompanyChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, company: e.target.value }));
    };

    const handleNoteStatusChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const status: ContactNoteStatus = e.currentTarget.value ? e.currentTarget.value as ContactNoteStatus : "OPEN";
        setSelectedNote((prev) => ({ ...prev, status }));
    };

    const handleNoteChanged = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const note = e.currentTarget?.value || "";
        setSelectedNote((prev) => ({ ...prev, note }));
    };

    const handleHistorySearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchHistory(e.target.value);
    };

    const handlePreviousNoteStatusChanged = (status: ContactNoteStatus, note: ContactNote) => {
        const contactId = selectedContact.id;
        if (!contactId) return;
        doActionWithLoader(setIsLoading, async () => {
            await fetch(`/api/contacts/${contactId}/notes/${note.id}`, { method: "PATCH", body: JSON.stringify({ ...note, status }) }).then((res) => res.json());
            await fetchContactNotes(contactId);
        });
    };

    const handleNoteDelete = (noteId: number) => {
        const contactId = selectedContact.id;
        if (!contactId) return;
        doActionWithLoader(setIsLoading, async () => {
            await fetch(`/api/contacts/${contactId}/notes/${noteId}`, { method: "DELETE" });
            await fetchContactNotes(contactId);
        });
    };

    const applyNotesHistoryFilter = ({ note }: ContactNote): boolean => {
        return !searchHistory || note.toLowerCase().includes(searchHistory.toLocaleLowerCase());
    };

    const handleSaveCurrentContact = async (e: FormEvent<HTMLFormElement>): Promise<number> => {
        e.preventDefault();
        let contactId = selectedContact.id;

        const contactEndpoint = contactId ? `/api/contacts/${contactId}` : "/api/contacts";
        const contactBody: Partial<Contact> = contactId
            ? {
                ...selectedContact,
                updatedBy: user?.username
            }
            : {
                ...selectedContact,
                createdBy: user?.username,
                updatedBy: user?.username,
            };
        const method = contactId ? "PATCH" : "POST";
        const contactResponse = await fetch(contactEndpoint, { method, body: JSON.stringify(contactBody) }).then(
            (res) => res.json()
        );

        if (!contactResponse.id) {
            throw Error("Contatto e nota non salvati!");
        }

        return Number(contactId);
    };

    const saveNewContactNote = async (contactId: number) => {
        const noteEndpoint = `/api/contacts/${contactId}/notes`;
        const noteBody: Partial<ContactNote> = {
            ...selectedNote,
            contactId,
            createdBy: user?.username,
            updatedBy: user?.username,
            event: "NOTES"
        };
        const noteResponse = await fetch(noteEndpoint, { method: "POST", body: JSON.stringify(noteBody) }).then(
            (res) => res.json()
        );

        if (!noteResponse.id) {
            throw Error("Nota non salvata!");
        }
    };

    const handleSaveNote = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const contactId = await handleSaveCurrentContact(e);
            await saveNewContactNote(contactId);
            setSelectedContact(prev => ({ ...prev, ...selectedContact, id: contactId }));
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
    };

    const handleBack = () => {
        router.push("/contacts");
    };

    useEffect(() => {
        if (!params?.id) return;
        const fetchContact = async () => {
            const _contact = await fetch(`/api/contacts/${params.id}`, { method: "GET" }).then((res) => res.json());
            setSelectedContact(_contact);
        };
        fetchContact();
    }, [params]);

    useEffect(() => {
        if (!selectedContact?.id) return;
        fetchContactNotes(selectedContact?.id);
    }, [selectedContact]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("contacts.title.editContact")}</span>
                </div>
                <div className="card">
                    <div className="card-body">
                        <div className="flex w-full flex-col xl:flex-row gap-4">
                            <div className="w-full">
                                <form onSubmit={handleSaveCurrentContact}>
                                    {(
                                        <>
                                            <div className="flex gap-4">
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.phoneNumber")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.phoneNumber}
                                                        required
                                                        readOnly
                                                        className="text-input" />
                                                </div>
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.firstName")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.firstName ?? ""}
                                                        required
                                                        className="text-input"
                                                        onChange={handleFirstNameChanged} />
                                                </div>
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.lastName")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.lastName ?? ""}
                                                        className="text-input"
                                                        onChange={handleLastNameChanged} />
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.email")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.email ?? ""}
                                                        className="text-input"
                                                        onChange={handleEmailChanged} />
                                                </div>
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.home")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.home ?? ""}
                                                        className="text-input"
                                                        onChange={handleHomeChanged} />
                                                </div>
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.company")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.company ?? ""}
                                                        className="text-input"
                                                        onChange={handleCompanyChanged} />
                                                </div>
                                            </div>

                                        </>
                                    )}

                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handleBack}>
                                            <div className="uppercase font-bold text-sm">{t("common.back")}</div>
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary">
                                            <div className="uppercase font-bold text-sm">{t("common.save")}</div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="flex w-full flex-col gap-8 xl:flex-row">
                    <div className="w-full xl:w-2/3">
                        <div>
                            <h2 className="capitalize text-l font-semibold text-gray-800 mt-8">{t("common.history")}</h2>
                        </div>
                        <div className='w-full my-6'>
                            <input
                                required
                                type="text"
                                className="text-input"
                                placeholder="Ricerca nota"
                                onChange={handleHistorySearch} />
                        </div>
                        <div className="overflow-auto flex flex-col gap-4 my-4">
                            {notes
                                .filter(n => applyNotesHistoryFilter(n))
                                .map(note => (
                                    <ContactNoteMessage
                                        key={note.id}
                                        author={note.createdBy}
                                        date={note.updatedAt}
                                        status={note.status}
                                        note={note.note}
                                        onNoteDelete={() => handleNoteDelete(note.id)}
                                        onStatusChanged={(status) => handlePreviousNoteStatusChanged(status, note)} />
                                ))}
                        </div>
                    </div>
                    <div className="w-full xl:w-1/3">
                        <div>
                            <h2 className="capitalize text-l font-semibold text-gray-800 mt-8">{t("contacts.notes.creates")}</h2>
                        </div>

                        <div className="my-6">
                            <div className="card ">
                                <div className="flex w-full flex-col xl:flex-row gap-4">
                                    <div className="w-full">
                                        <form onSubmit={handleSaveNote} className="">
                                            <div className='w-full my-4'>
                                                <div className='field-label'>Status</div>
                                                <select className='text-input uppercase'
                                                    required
                                                    value={selectedNote.status}
                                                    onChange={handleNoteStatusChanged} >
                                                    <option value="OPEN" className="uppercase">🟡 {t("common.open")}</option>
                                                    <option value="PENDING" className="uppercase">🟡 {t("common.pending")}</option>
                                                    <option value="CLOSED" className="uppercase">🟢 {t("common.closed")}</option>
                                                </select>
                                            </div>
                                            <div className="mb-6">
                                                <div className='field-label'>Messaggio nota</div>
                                                <textarea
                                                    className="border border-gray-400 w-full p-1"
                                                    rows={3}
                                                    required
                                                    onChange={handleNoteChanged} />
                                            </div>

                                            <div className="flex justify-center items-center gap-2 flex-wrap">
                                                <button
                                                    type="submit"
                                                    className="btn-primary">
                                                    <div className="uppercase font-bold text-sm">{t("common.add")}</div>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout >
    );
};

export default EditContact;
