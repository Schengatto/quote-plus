import { useAppStore } from "@/store/app";
import { useContactsStore } from "@/store/contacts";
import { doActionWithLoader } from "@/utils/actions";
import { ReactNode, useCallback, useEffect } from "react";

interface ContactsLayoutProps {
    children: ReactNode
}

const ContactsLayout: React.FunctionComponent<ContactsLayoutProps> = ({ children }) => {

    const { setIsLoading } = useAppStore();
    const { setContacts } = useContactsStore();

    const fetchContacts = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _contacts = await fetch("/api/contacts", { method: "GET" }).then((res) => res.json());
            setContacts(_contacts);
        });
    }, [setIsLoading]);


    useEffect(() => {
        fetchContacts();
    }, []);

    return (<>{children}</>)
};

export default ContactsLayout;