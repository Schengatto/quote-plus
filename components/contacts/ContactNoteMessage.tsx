import { useI18nStore } from "@/store/i18n";
import { ContactNoteStatus } from "@/types/contacts";
import { ChangeEvent } from "react";

export interface ContactNoteMessageProps {
    status: ContactNoteStatus;
    author: string;
    date: Date;
    note: string;
    onStatusChanged: (status: ContactNoteStatus) => void;
    onNoteDelete: () => void;
}

const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
};

const ContactNoteMessage: React.FunctionComponent<ContactNoteMessageProps> = (
    { status, author, date, note, onStatusChanged, onNoteDelete }: ContactNoteMessageProps) => {
    const { t } = useI18nStore();

    const statusCircle = status === "CLOSED" ? "🟢" : "🟡";
    const statusColor = status === "CLOSED" ? "bg-green-200" : "bg-amber-200";
    const noteDate = new Date(date).toLocaleDateString(undefined, options);

    const handleNoteStatusChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const status: ContactNoteStatus = !!e.currentTarget.value ? e.currentTarget.value as ContactNoteStatus : "OPEN";
        onStatusChanged(status);
    };
    return (
        <div className={`${statusColor} p-2`}>
            <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                    <select className='uppercase bg-transparent'
                        required
                        value={status}
                        onChange={handleNoteStatusChanged} >
                        <option value="OPEN" className="uppercase">🟡</option>
                        <option value="CLOSED" className="uppercase">🟢</option>
                    </select>
                    <div className="font-bold uppercase">{author}</div>
                </div>
                <div className="flex gap-2">
                <div className="font-bold">{noteDate}</div>
                <div className="text-right cursor-pointer" onClick={onNoteDelete}>❌</div>
                </div>
            </div>
            <div className="my-2">{note}</div>
        </div>
    );
};

export default ContactNoteMessage;