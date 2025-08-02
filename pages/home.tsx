import ContactNoteMessage from "@/components/contacts/ContactNoteMessage";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { doActionWithLoader } from "@/utils/actions";
import { ContactNote } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface ContactNoteWithContact extends ContactNote {
    contact: { id: string, firstName: string, phoneNumber: string }
}

const Home = () => {
    const router = useRouter();
    const user = useAuth();

    const { setIsLoading } = useAppStore();
    const { t } = useI18nStore();

    const [pendingNotes, setPendingNotes] = useState<ContactNoteWithContact[]>([]);

    const fetchNotes = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _notes: ContactNoteWithContact[] = await fetch("/api/notes", { method: "GET" }).then((res) => res.json());
            const _filteredNotes = _notes.filter(n => ["OPEN", "PENDING"].includes(n.status));
            setPendingNotes(_filteredNotes);
        });
    }, [setIsLoading]);


    useEffect(() => {
        fetchNotes();
    }, []);


    return (
        <AppLayout>
            <div className="m-8" >
                <div className='w-full'>
                    <h1 className='text-xl font-semibold text-gray-800 border-b pb-2 mb-4'>{t("common.pendingNotes")}</h1>
                </div>
                <div className="m-4 flex flex-col gap-4">
                    <div className="overflow-auto flex flex-col gap-4 my-4">
                        {pendingNotes
                            .map(note => (
                                <ContactNoteMessage
                                    key={note.id}
                                    author={note.createdBy}
                                    date={note.updatedAt}
                                    status={note.status}
                                    note={note.note}
                                    contact={note.contact} />
                            ))}
                        {!pendingNotes.length && <>
                            <div className="flex flex-col m-auto items-center gap-8">
                                <img src="/images/no-task.png" width={100} alt="No Task" />
                                <div className="font-semibold text-xl">{t("common.noPendingTasks")}!</div>
                            </div>
                        </>
                        }
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Home;