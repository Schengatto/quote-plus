import ContactNoteMessage from "@/components/contacts/ContactNoteMessage";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { ContactNote } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

interface ContactData {
    name: string;
    value: any;
}

interface ContactNoteWithContact extends ContactNote {
    contact: {id: string, firstName: string, phoneNumber: string}
}

const Notes = () => {

    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();

    const [ notes, setNotes ] = useState<ContactNoteWithContact[]>([]);
    const [ searchHistory, setSearchHistory ] = useState<string>("");

    const fetchNotes = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _contacts = await fetch("/api/notes", { method: "GET" }).then((res) => res.json());
            setNotes(_contacts);
        });
    }, [ setIsLoading ]);

    const handleHistorySearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchHistory(e.target.value);
    };

    const applyNotesHistoryFilter = ({ note }: ContactNoteWithContact): boolean => {
        return !searchHistory || note.toLowerCase().includes(searchHistory.toLocaleLowerCase());
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    return (
        <AppLayout>
            <div className= "m-8" >
                <div className='w-full'>
                    <div className='font-extrabold text-sm uppercase'>{t("common.history")}</div>
                    <input
                        required
                        type="text"
                        className="text-input"
                        placeholder="Search note"
                        onChange={handleHistorySearch} />
                </div>
                <div className="flex flex-col gap-4 my-4" >
                    { notes && notes
                        .filter(n => applyNotesHistoryFilter(n))
                        .map(note => (
                            <ContactNoteMessage
                                key={note.id}
                                author={note.createdBy}
                                date={note.updatedAt}
                                status={note.status}
                                note={note.note}
                                contact={note.contact} />
                        ))}
                </div>
            </div>
        </AppLayout>
    );
};

export default Notes;
