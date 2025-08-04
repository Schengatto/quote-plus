import { useI18nStore } from "@/store/i18n";
import { ContactNoteStatus } from "@/types/contacts";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";

export interface ContactNoteMessageProps {
    status: ContactNoteStatus;
    author: string;
    date: Date;
    note: string;
    contact?: { id: string, firstName: string, phoneNumber: string }
    onStatusChanged?: (status: ContactNoteStatus) => void;
    onNoteDelete?: () => void;
}

const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
};

const ContactNoteMessage: React.FunctionComponent<ContactNoteMessageProps> = ({
    status,
    author,
    date,
    note,
    contact,
    onStatusChanged,
    onNoteDelete,
}: ContactNoteMessageProps) => {
    const { t } = useI18nStore();
    const router = useRouter();

    const statusCircle = status === "CLOSED" ? "🟢" : "🟡";
    const statusColor = status === "CLOSED" ? "bg-green-200" : "bg-amber-200";
    const noteDate = new Date(date).toLocaleDateString(undefined, options);

    const handleNoteStatusChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        if (!onStatusChanged) return;
        const status: ContactNoteStatus = e.currentTarget.value ? e.currentTarget.value as ContactNoteStatus : "OPEN";
        onStatusChanged(status);
    };

    const handleContactClick = () => {
        if (!contact) return;
        router.push(`/contacts/${contact.id}`);
    };

    return (
        <div className={`rounded-xl shadow-sm border-l-4 ${status === "CLOSED" ? "border-green-400 bg-emerald-100" : "border-yellow-400 bg-yellow-50"} p-4 mb-4`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {onStatusChanged ? (
                        <select
                            className="uppercase bg-transparent text-xl"
                            required
                            value={status}
                            onChange={handleNoteStatusChanged}
                        >
                            <option value="OPEN">🟡</option>
                            <option value="CLOSED">🟢</option>
                        </select>
                    ) : (
                        <div className="text-xl">{statusCircle}</div>
                    )}
                    <span className="uppercase text-sm text-gray-800 font-semibold">{author}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{noteDate}</span>
                    {onNoteDelete && (
                        <button onClick={onNoteDelete} className="text-red-500 hover:text-red-700" title="Delete">
                            ❌
                        </button>
                    )}
                </div>
            </div>

            <p className="text-gray-700 mb-3 whitespace-pre-line">{note}</p>

            {contact && (
                <div
                    className="font-semibold text-sm text-blue-700 cursor-pointer hover:underline"
                    onClick={handleContactClick}
                >
                    {contact.firstName} - ({contact.phoneNumber})
                </div>
            )}
        </div>
    );
};

export default ContactNoteMessage;