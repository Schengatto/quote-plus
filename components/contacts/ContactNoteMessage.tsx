import { useI18nStore } from "@/store/i18n";
import { ContactNoteStatus } from "@/types/contacts";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";

export interface ContactNoteMessageProps {
    status: ContactNoteStatus;
    author: string;
    date: Date;
    note: string;
    contact?: {id: string, firstName: string, phoneNumber: string}
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
        <div className={`${statusColor} p-2`}>
            <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                    {onStatusChanged
                        ? <select className='uppercase bg-transparent'
                            required
                            value={status}
                            onChange={handleNoteStatusChanged} >
                            <option value="OPEN" className="uppercase">🟡</option>
                            <option value="CLOSED" className="uppercase">🟢</option>
                        </select>
                        : <div>{statusCircle}</div>
                    }
                    <div className="font-bold uppercase">{author}</div>
                </div>
                <div className="flex gap-2">
                    <div className="font-bold">{noteDate}</div>
                    {onNoteDelete && <div className="text-right cursor-pointer" onClick={onNoteDelete}>❌</div>}
                </div>
            </div>
            <div className="my-2">{note}</div>
            {contact 
                && <div className="flex my-2 font-bold cursor-pointer hover:text-sky-700" onClick={handleContactClick}>
                    {contact.firstName} - ({contact.phoneNumber})
                </div>
            }
        </div>
    );
};

export default ContactNoteMessage;