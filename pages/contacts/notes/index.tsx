import ContactNoteMessage from "@/components/contacts/ContactNoteMessage";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { ContactNote } from "@prisma/client";
import { useEffect, useRef, useState } from "react";

interface ContactData {
    name: string;
    value: any;
}

interface ContactNoteWithContact extends ContactNote {
    contact: { id: string, firstName: string, phoneNumber: string }
}

const Notes = () => {
    const { t } = useI18nStore();
    const { setIsLoading } = useAppStore();

    const [notes, setNotes] = useState<ContactNoteWithContact[]>([]);
    const [searchHistory, setSearchHistory] = useState("");
    const [visibleCount, setVisibleCount] = useState(30);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchNotes = async () => {
            setIsLoading(true);
            const res = await fetch("/api/notes");
            const data = await res.json();
            setNotes(data);
            setIsLoading(false);
        };

        fetchNotes();
    }, []);

    const handleHistorySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchHistory(e.target.value);
        setVisibleCount(30); // resetta la visualizzazione quando cerchi
    };

    const applyNotesHistoryFilter = ({ note }: ContactNoteWithContact): boolean => {
        return !searchHistory || note.toLowerCase().includes(searchHistory.toLowerCase());
    };

    const filteredNotes = notes.filter(applyNotesHistoryFilter);
    const visibleNotes = filteredNotes.slice(0, visibleCount);

    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisibleCount((count) => {
                    if (count >= filteredNotes.length) return count;
                    return count + 30;
                });
            }
        });

        observer.observe(loadMoreRef.current);

        return () => {
            observer.disconnect();
        };
    }, [filteredNotes.length]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="w-full">
                    <h1 className="capitalize text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                        {t("common.history")}
                    </h1>
                    <input
                        required
                        type="text"
                        className="text-input"
                        placeholder="Ricerca nota"
                        onChange={handleHistorySearch}
                        value={searchHistory}
                    />
                </div>
                <div className="flex flex-col gap-4 my-4">
                    {visibleNotes.map(note => (
                        <ContactNoteMessage
                            key={note.id}
                            author={note.createdBy}
                            date={note.updatedAt}
                            status={note.status}
                            note={note.note}
                            contact={note.contact}
                        />
                    ))}
                </div>
                {visibleCount < filteredNotes.length && (
                    <div ref={loadMoreRef} className="text-center py-4 text-gray-500">
                        Carica altre note...
                    </div>
                )}
            </div>
        </AppLayout>
    );
};


export default Notes;
