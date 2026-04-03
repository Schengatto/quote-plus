import ContactNoteMessage from "@/components/contacts/ContactNoteMessage";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { ContactNoteStatus } from "@/types/contacts";
import { doActionWithLoader } from "@/utils/actions";
import { Contact, ContactGroup, ContactNote } from "@prisma/client";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { MdGroupAdd, MdGroupRemove, MdPhone, MdSend } from "react-icons/md";

type ContactWithGroup = Contact & { group?: ContactGroup | null };
type NoteWithContact = ContactNote & { contact?: { phoneNumber: string; firstName: string | null; lastName: string | null } };

const EditContact = () => {

    const router = useRouter();
    const params = useParams();
    const { userData: user } = useAuth();

    const { setIsLoading } = useAppStore();
    const { t } = useI18nStore();

    const defaultContact: Partial<ContactWithGroup> = {
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

    const [ selectedContact, setSelectedContact ] = useState<Partial<ContactWithGroup>>(defaultContact);
    const [ notes, setNotes ] = useState<NoteWithContact[]>([]);
    const [ selectedNote, setSelectedNote ] = useState<Partial<ContactNote>>({ status: "OPEN" });
    const [ searchHistory, setSearchHistory ] = useState<string>("");

    // Group management state
    const [ showGroupSearch, setShowGroupSearch ] = useState(false);
    const [ groupSearchQuery, setGroupSearchQuery ] = useState("");
    const [ groupSearchResults, setGroupSearchResults ] = useState<ContactGroup[]>([]);
    const [ showCreateGroup, setShowCreateGroup ] = useState(false);
    const [ newGroupName, setNewGroupName ] = useState("");

    const fetchContactNotes = useCallback(async (contactId: number, groupId?: number | null) => {
        doActionWithLoader(setIsLoading, async () => {
            if (groupId) {
                // Fetch unified notes from all contacts in the group
                const groupNotes = await fetch(`/api/contact-groups/${groupId}/notes`, { method: "GET" }).then((res) => res.json());
                setNotes(groupNotes);
            } else {
                const _contactsNotes = await fetch(`/api/contacts/${contactId}/notes`, { method: "GET" }).then((res) => res.json());
                setNotes(_contactsNotes);
            }
        });
    }, [ setIsLoading ]);

    // --- Group management ---
    const searchGroups = async (query: string) => {
        const response = await fetch(`/api/contact-groups/search?q=${encodeURIComponent(query.trim())}`).then((res) => res.json());
        setGroupSearchResults(response.results || []);
    };

    const handleGroupSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setGroupSearchQuery(query);
        searchGroups(query);
    };

    const handleLinkToGroup = async (groupId: number) => {
        if (!selectedContact.id) return;
        await doActionWithLoader(setIsLoading, async () => {
            await fetch(`/api/contacts/${selectedContact.id}`, {
                method: "PATCH",
                body: JSON.stringify({ id: selectedContact.id, groupId, updatedBy: user?.username }),
            });
            const updatedContact = await fetch(`/api/contacts/${selectedContact.id}`, { method: "GET" }).then((res) => res.json());
            setSelectedContact(updatedContact);
            setShowGroupSearch(false);
            setGroupSearchQuery("");
            setGroupSearchResults([]);
            fetchContactNotes(selectedContact.id!, updatedContact.groupId);
        });
    };

    const handleUnlinkFromGroup = async () => {
        if (!selectedContact.id) return;
        if (!confirm(t("contacts.group.confirmUnlink"))) return;
        await doActionWithLoader(setIsLoading, async () => {
            await fetch(`/api/contacts/${selectedContact.id}`, {
                method: "PATCH",
                body: JSON.stringify({ id: selectedContact.id, groupId: null, updatedBy: user?.username }),
            });
            const updatedContact = await fetch(`/api/contacts/${selectedContact.id}`, { method: "GET" }).then((res) => res.json());
            setSelectedContact(updatedContact);
            fetchContactNotes(selectedContact.id!);
        });
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !selectedContact.id) return;
        await doActionWithLoader(setIsLoading, async () => {
            const groupResponse = await fetch("/api/contact-groups/search?q=", { method: "GET" }).then(() =>
                fetch("/api/contact-groups", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: newGroupName.trim(),
                        company: selectedContact.company || null,
                        createdBy: user?.username || "system",
                        updatedBy: user?.username || "system",
                    }),
                }).then((res) => res.json())
            );
            if (groupResponse.id) {
                await handleLinkToGroup(groupResponse.id);
            }
            setShowCreateGroup(false);
            setNewGroupName("");
        }, (error) => alert(error.message));
    };

    const handleOpenGroupSearch = () => {
        setShowGroupSearch(true);
        setShowCreateGroup(false);
        setGroupSearchQuery("");
        searchGroups("");
    };

    const handleOpenCreateGroup = () => {
        setShowCreateGroup(true);
        setShowGroupSearch(false);
        setNewGroupName(selectedContact.company || `${selectedContact.firstName || ""} ${selectedContact.lastName || ""}`.trim());
    };

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

    const handleLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, label: e.target.value }));
    };

    const handleWhatsappChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, whatsapp: e.target.value }));
    };

    const handleTelegramChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContact((prev) => ({ ...prev, telegram: e.target.value }));
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
        const { group, ...contactData } = selectedContact as ContactWithGroup;
        const contactBody: Partial<Contact> = contactId
            ? {
                ...contactData,
                updatedBy: user?.username
            }
            : {
                ...contactData,
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
            const updatedContact = await fetch(`/api/contacts/${contactId}`, { method: "GET" }).then((res) => res.json());
            if (updatedContact && updatedContact.id) {
                setSelectedContact(updatedContact);
            } else {
                setSelectedContact(prev => ({ ...prev, id: contactId }));
            }
            await fetchContactNotes(contactId, updatedContact?.groupId);
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
            if (_contact && _contact.id) {
                setSelectedContact(_contact);
            }
        };
        fetchContact();
    }, [ params ]);

    const groupId = (selectedContact as ContactWithGroup)?.groupId ?? null;

    useEffect(() => {
        if (!selectedContact?.id) return;
        fetchContactNotes(selectedContact.id, groupId);
    }, [ selectedContact?.id, groupId, fetchContactNotes ]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="page-title">
                    <span className="capitalize">{t("contacts.title.editContact")}</span>
                </div>
                {(selectedContact.whatsapp || selectedContact.telegram) &&
                    <div className="my-4">
                        <div className="flex justify-end content-end w-full gap-4">
                            {selectedContact.whatsapp &&
                                <button className="btn-primary"
                                    onClick={() => {
                                        window.open(`https://wa.me/${selectedContact.phoneNumber}`, "_blank");
                                    }}>
                                    <MdPhone />
                                    <span className="uppercase font-semibold text-sm">{t("common.whatsapp")}</span>
                                </button>
                            }
                            {selectedContact.telegram &&
                                <button
                                    className="btn-primary"
                                    onClick={() => {
                                        window.open(`https://t.me/${selectedContact.telegram}`, "_blank");
                                    }}>
                                    <div>
                                        <MdSend />
                                    </div>
                                    <div className="uppercase font-semibold text-sm">{t("common.telegram")}</div>
                                </button>
                            }
                        </div>
                    </div>
                }

                <div className="card">
                    <div className="card-body">
                        <div className="flex w-full flex-col xl:flex-row gap-4">
                            <div className="w-full">
                                <form onSubmit={handleSaveCurrentContact}>
                                    {(
                                        <>
                                            <div className="flex flex-col xl:flex-row xl:gap-4">
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
                                            <div className="flex flex-col xl:flex-row xl:gap-4">
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

                                            <div className="flex flex-col xl:flex-row xl:gap-4">
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.label")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.label ?? ""}
                                                        className="text-input"
                                                        onChange={handleLabelChange} />
                                                </div>
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.hasWhatsapp")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.whatsapp ?? ""}
                                                        className="text-input"
                                                        onChange={handleWhatsappChange} />
                                                </div>
                                                <div className="w-full xl:w-1/3 my-4">
                                                    <div className="field-label">{t("contacts.form.hasTelegram")}</div>
                                                    <input
                                                        type="text"
                                                        value={selectedContact.telegram ?? ""}
                                                        className="text-input"
                                                        onChange={handleTelegramChange} />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex justify-center items-center gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={handleBack}>
                                            <div className="uppercase text-sm">{t("common.back")}</div>
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary">
                                            <div className="uppercase text-sm">{t("common.save")}</div>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Group management section */}
                {selectedContact.id && (
                    <div className="card mt-4">
                        <div className="card-body">
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="font-semibold">{t("contacts.group")}:</span>
                                {(selectedContact as ContactWithGroup).group ? (
                                    <>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {(selectedContact as ContactWithGroup).group!.name}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-primary bg-red-600 hover:bg-red-700 text-xs"
                                            onClick={handleUnlinkFromGroup}>
                                            <MdGroupRemove />
                                            <span className="uppercase text-sm">{t("contacts.group.unlinkFromGroup")}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary text-xs"
                                            onClick={handleOpenGroupSearch}>
                                            <MdGroupAdd />
                                            <span className="uppercase text-sm">{t("contacts.group.linkToGroup")}</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-gray-500 text-sm italic">-</span>
                                        <button
                                            type="button"
                                            className="btn-primary text-xs"
                                            onClick={handleOpenGroupSearch}>
                                            <MdGroupAdd />
                                            <span className="uppercase text-sm">{t("contacts.group.linkToGroup")}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary bg-green-600 hover:bg-green-700 text-xs"
                                            onClick={handleOpenCreateGroup}>
                                            <MdGroupAdd />
                                            <span className="uppercase text-sm">{t("contacts.group.createNewGroup")}</span>
                                        </button>
                                    </>
                                )}
                            </div>

                            {showGroupSearch && (
                                <div className="mt-4 p-3 border border-gray-300 rounded bg-gray-50">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="text-input"
                                            placeholder={t("contacts.group.searchGroups")}
                                            value={groupSearchQuery}
                                            onChange={handleGroupSearchChange}
                                            autoFocus
                                        />
                                        {groupSearchResults.length > 0 ? (
                                            <ul className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-gray-300 rounded shadow-lg">
                                                {groupSearchResults.map((group) => (
                                                    <li
                                                        key={group.id}
                                                        className="py-2 px-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm"
                                                        onClick={() => handleLinkToGroup(group.id)}>
                                                        <span className="font-medium">{group.name}</span>
                                                        {group.company && <span className="text-gray-400 text-xs">{group.company}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : groupSearchQuery.trim() ? (
                                            <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-gray-500 text-sm">
                                                {t("contacts.group.noGroupsFound")}
                                                <button
                                                    type="button"
                                                    className="ml-2 text-blue-600 underline"
                                                    onClick={handleOpenCreateGroup}>
                                                    {t("contacts.group.createNewGroup")}
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-secondary mt-2 text-xs"
                                        onClick={() => setShowGroupSearch(false)}>
                                        <span className="uppercase text-sm">{t("common.cancel")}</span>
                                    </button>
                                </div>
                            )}

                            {showCreateGroup && (
                                <div className="mt-4 p-3 border border-gray-300 rounded bg-gray-50">
                                    <div className="field-label">{t("contacts.group.groupName")}</div>
                                    <input
                                        type="text"
                                        className="text-input mb-3"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="btn-primary bg-green-600 hover:bg-green-700"
                                            onClick={handleCreateGroup}>
                                            <span className="uppercase text-sm">{t("common.confirm")}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setShowCreateGroup(false)}>
                                            <span className="uppercase text-sm">{t("common.cancel")}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex w-full flex-col gap-8 xl:flex-row">
                    <div className="w-full xl:w-2/3">
                        <div>
                            <h2 className="capitalize text-l font-semibold text-gray-800 mt-8">
                                {(selectedContact as ContactWithGroup).group
                                    ? `${t("contacts.group.groupNotes")} - ${(selectedContact as ContactWithGroup).group!.name}`
                                    : t("common.history")
                                }
                            </h2>
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
                                    <div key={note.id}>
                                        {(selectedContact as ContactWithGroup).group && (note as NoteWithContact).contact && (
                                            <div className="text-xs text-gray-500 mb-1 ml-1">
                                                {(note as NoteWithContact).contact!.firstName}{" "}
                                                {(note as NoteWithContact).contact!.lastName}{" — "}
                                                {(note as NoteWithContact).contact!.phoneNumber}
                                            </div>
                                        )}
                                        <ContactNoteMessage
                                            author={note.createdBy}
                                            date={note.updatedAt}
                                            status={note.status}
                                            note={note.note}
                                            onNoteDelete={() => handleNoteDelete(note.id)}
                                            onStatusChanged={(status) => handlePreviousNoteStatusChanged(status, note)} />
                                    </div>
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
                                                    onChange={handleNoteChanged} />
                                            </div>

                                            <div className="flex justify-center items-center gap-2 flex-wrap">
                                                <button
                                                    type="submit"
                                                    className="btn-primary">
                                                    <div className="uppercase text-sm">{t("common.add")}</div>
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
