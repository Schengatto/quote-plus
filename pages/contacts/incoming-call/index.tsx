import ContactNoteMessage from "@/components/contacts/ContactNoteMessage";
import { useAuth } from "@/hooks/useAuth";
import ContactsLayout from "@/layouts/Contacts";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useContactsStore } from "@/store/contacts";
import { useI18nStore } from "@/store/i18n";
import { ContactNoteStatus } from "@/types/contacts";
import { doActionWithLoader } from "@/utils/actions";
import { Contact, ContactNote } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

const IncomingCall = () => {
    const searchParams = useSearchParams();
    const user = useAuth();

    const { setIsLoading } = useAppStore();
    const { t } = useI18nStore();

    const { contacts } = useContactsStore();

    const phoneNumber = searchParams.get("phone-number") ?? searchParams.get("phoneNumber");
    const displayName = searchParams.get("display-name") ?? searchParams.get("displayName");

    const defaultContact: Partial<Contact> = {
        firstName: displayName ?? "",
        lastName: "",
        phoneNumber: phoneNumber ?? "",
        email: "",
        mobile: phoneNumber ?? "",
        business: "",
        businessFax: "",
        company: "",
        home: ""
    }

    const [contactData, setContactData] = useState<Partial<Contact>>(defaultContact);
    const [selectedContanct, setSelectedContanct] = useState<Partial<Contact>>({});
    const [isContactPreset, setIsContactPreset] = useState<boolean>(false);
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
        setSelectedContanct((prev) => ({ ...prev, firstName: e.target.value }));
    };

    const handleLastNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContanct((prev) => ({ ...prev, lastName: e.target.value }));
    };

    const handleEmailChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContanct((prev) => ({ ...prev, email: e.target.value }));
    };

    const handleHomeChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContanct((prev) => ({ ...prev, home: e.target.value }));
    };

    const handleCompanyChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContanct((prev) => ({ ...prev, company: e.target.value }));
    };

    const handleNoteStatusChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const status: ContactNoteStatus = !!e.currentTarget.value ? e.currentTarget.value as ContactNoteStatus : "OPEN";
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
        const contactId = contactData.id;
        if (!contactId) return;
        doActionWithLoader(setIsLoading, async () => {
            await fetch(`/api/contacts/${contactId}/notes/${note.id}`, { method: "PATCH", body: JSON.stringify({ ...note, status }) }).then((res) => res.json());
            await fetchContactNotes(contactId);
        });
    }

    const handleNoteDelete = (noteId: number) => {
        const contactId = contactData.id;
        if (!contactId) return;
        doActionWithLoader(setIsLoading, async () => {
            await fetch(`/api/contacts/${contactId}/notes/${noteId}`, { method: "DELETE" });
            await fetchContactNotes(contactId);
        });
    }

    const applyNotesHistoryFilter = ({ note }: ContactNote): boolean => {
        return !searchHistory || note.toLowerCase().includes(searchHistory.toLocaleLowerCase());
    }

    const saveCurrentContact = async (): Promise<number> => {
        let contactId = contactData.id;

        const contactEndpoint = contactId ? `/api/contacts/${contactId}` : `/api/contacts`;
        const contactBody: Partial<Contact> = contactId
            ? {
                ...contactData,
                ...selectedContanct,
                updatedBy: user?.username
            }
            : {
                ...selectedContanct,
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

        return Number(contactResponse.id);
    }

    const saveNewContactNote = async (contactId: number) => {
        const noteEndpoint = `/api/contacts/${contactId}/notes`;
        const noteBody: Partial<ContactNote> = {
            ...selectedNote,
            contactId,
            createdBy: user?.username,
            updatedBy: user?.username,
            event: "INCOMING_CALL"
        };
        const noteResponse = await fetch(noteEndpoint, { method: "POST", body: JSON.stringify(noteBody) }).then(
            (res) => res.json()
        );

        if (!noteResponse.id) {
            throw Error("Nota non salvata!");
        }
    }

    const handleSaveNote = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const contactId = await saveCurrentContact();
            await saveNewContactNote(contactId);
            setContactData(prev => ({ ...prev, ...selectedContanct, id: contactId }));
            setIsContactPreset(true);
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
    };

    useEffect(() => {
        if (!contacts || !phoneNumber) return;
        const contactMatch = (c: Contact) => !!c.phoneNumber && (c.phoneNumber == phoneNumber || c.mobile == phoneNumber || c.firstName == displayName);
        const storedContact: Contact | null = contacts.find(c => contactMatch(c)) || null;
        setIsContactPreset(!!storedContact);

        setContactData(storedContact || defaultContact);
    }, [phoneNumber, displayName, contacts]);

    useEffect(() => {
        if (!contactData.id) {
            setSelectedContanct({ phoneNumber: phoneNumber ?? "", firstName: displayName })
            return;
        };
        setSelectedContanct(contactData);
        fetchContactNotes(contactData.id);
    }, [contactData]);


    return (
        <AppLayout>
            <ContactsLayout>
                <div className="m-8">
                    <div className="m-8 card">
                        <div className="card-header">
                            {t("contacts.event.incomingCall")}
                        </div>
                        <div className="card-body">

                            {!isContactPreset && <div className="bg-amber-200 w-1/2 text-center text-2xl font-bold">Contact not found!</div>}

                            <div className="flex w-full flex-col xl:flex-row gap-4">
                                <div className="w-full xl:w-2/3">
                                    <form onSubmit={handleSaveNote}>
                                        {(
                                            <>
                                                <div className="flex gap-4">
                                                    <div className="w-1/3 my-4">
                                                        <div className="font-extrabold text-lg uppercase">{t("contacts.form.phoneNumber")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.phoneNumber}
                                                            required
                                                            readOnly
                                                            className="text-input" />
                                                    </div>
                                                    <div className="w-1/3 my-4">
                                                        <div className="font-extrabold text-lg uppercase">{t("contacts.form.firstName")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.firstName ?? ""}
                                                            required
                                                            className="text-input"
                                                            onChange={handleFirstNameChanged} />
                                                    </div>
                                                    <div className="w-1/3 my-4">
                                                        <div className="font-extrabold text-lg uppercase">{t("contacts.form.lastName")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.lastName ?? ""}
                                                            className="text-input"
                                                            onChange={handleLastNameChanged} />
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="w-1/3 my-4">
                                                        <div className="font-extrabold text-lg uppercase">{t("contacts.form.email")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.email ?? ""}
                                                            className="text-input"
                                                            onChange={handleEmailChanged} />
                                                    </div>
                                                    <div className="w-1/3 my-4">
                                                        <div className="font-extrabold text-lg uppercase">{t("contacts.form.home")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.home ?? ""}
                                                            className="text-input"
                                                            onChange={handleHomeChanged} />
                                                    </div>
                                                    <div className="w-1/3 my-4">
                                                        <div className="font-extrabold text-lg uppercase">{t("contacts.form.company")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.company ?? ""}
                                                            className="text-input"
                                                            onChange={handleCompanyChanged} />
                                                    </div>
                                                </div>

                                            </>
                                        )}

                                        <div className='w-full my-4'>
                                            <div className='font-extrabold text-lg uppercase'>Status</div>
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
                                            <textarea
                                                className="border border-gray-900 w-full p-1"
                                                rows={10}
                                                required
                                                onChange={handleNoteChanged} />
                                        </div>

                                        <div className="flex justify-center items-center gap-2 flex-wrap">
                                            <button
                                                type="submit"
                                                className="btn-primary">
                                                <div className="uppercase font-bold text-lg">{t("common.save")}</div>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="w-full xl:w-1/3 flex flex-col gap-4 my-4">
                                    <div className='w-full'>
                                        <div className='font-extrabold text-lg uppercase'>{t("common.history")}</div>
                                        <input
                                            required
                                            type="text"
                                            className="text-input"
                                            placeholder="Search note"
                                            onChange={handleHistorySearch} />
                                    </div>
                                    <div className="max-h-[500px] overflow-auto flex flex-col gap-4 my-4">
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
                            </div>

                        </div>
                    </div>
                </div>
            </ContactsLayout>
        </AppLayout>
    );
};

export default IncomingCall;
