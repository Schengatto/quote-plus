import { useAuth } from "@/hooks/useAuth";
import ContactsLayout from "@/layouts/Contacts";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useContactsStore } from "@/store/contacts";
import { useI18nStore } from "@/store/i18n";
import { Contact } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

const IncomingCall = () => {
    const searchParams = useSearchParams();
    const user = useAuth();
    const router = useRouter();

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
    };

    const [contactData, setContactData] = useState<Partial<Contact>>(defaultContact);
    const [selectedContanct, setSelectedContanct] = useState<Partial<Contact>>({});

    const handlePhoneNumberChanged = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedContanct((prev) => ({ ...prev, phoneNumber: e.target.value }));
    };

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

    const saveCurrentContact = async (): Promise<number> => {
        let contactId = contactData.id;

        const contactEndpoint = contactId ? `/api/contacts/${contactId}` : "/api/contacts";
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
    };

    const handleSaveContact = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const contactId = await saveCurrentContact();
            router.push(`/contacts/${contactId}`);
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
    };

    useEffect(() => {
        if (!contacts || !phoneNumber) return;
        const contactMatch = (c: Contact) => !!c.phoneNumber && (c.phoneNumber == phoneNumber || c.mobile == phoneNumber || c.firstName == displayName);
        const storedContact: Contact | null = contacts.find(c => contactMatch(c)) || null;

        setContactData(storedContact || defaultContact);
    }, [phoneNumber, displayName, contacts]);

    useEffect(() => {
        if (!contactData.id) {
            setSelectedContanct({ phoneNumber: phoneNumber ?? "", firstName: displayName });
            return;
        };
        setSelectedContanct(contactData);
    }, [contactData]);

    return (
        <AppLayout>
            <ContactsLayout>
                <div className="m-2 xl:m-8">
                    <div className="flex text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                        <span className="capitalize">{t("contacts.button.addContact")}</span>
                    </div>

                    <div className="my-8 card">
                        <div className="card-body">
                            <div className="flex w-full flex-col xl:flex-row gap-4">
                                <div className="w-full">
                                    <form onSubmit={handleSaveContact}>
                                        {(
                                            <>
                                                <div className="flex flex-col xl:flex-row xl:gap-4">
                                                    <div className="w-full xl:w-1/3 my-4">
                                                        <div className="field-label">{t("contacts.form.phoneNumber")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.phoneNumber}
                                                            required
                                                            className="text-input"
                                                            onChange={handlePhoneNumberChanged} />
                                                    </div>
                                                    <div className="w-full xl:w-1/3 my-4">
                                                        <div className="field-label">{t("contacts.form.firstName")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.firstName ?? ""}
                                                            required
                                                            className="text-input"
                                                            onChange={handleFirstNameChanged} />
                                                    </div>
                                                    <div className="w-full xl:w-1/3 my-4">
                                                        <div className="field-label">{t("contacts.form.lastName")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.lastName ?? ""}
                                                            className="text-input"
                                                            onChange={handleLastNameChanged} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col xl:flex-row xl:gap-4">
                                                    <div className="w-full xl:w-1/3 my-4">
                                                        <div className="field-label">{t("contacts.form.email")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.email ?? ""}
                                                            className="text-input"
                                                            onChange={handleEmailChanged} />
                                                    </div>
                                                    <div className="w-full xl:w-1/3 my-4">
                                                        <div className="field-label">{t("contacts.form.home")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.home ?? ""}
                                                            className="text-input"
                                                            onChange={handleHomeChanged} />
                                                    </div>
                                                    <div className="w-full xl:w-1/3 my-4">
                                                        <div className="field-label">{t("contacts.form.company")}</div>
                                                        <input
                                                            type="text"
                                                            value={selectedContanct.company ?? ""}
                                                            className="text-input"
                                                            onChange={handleCompanyChanged} />
                                                    </div>
                                                </div>

                                            </>
                                        )}
                                        <div className="flex justify-center items-center gap-2 flex-wrap">
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
                </div>
            </ContactsLayout>
        </AppLayout>
    );
};

export default IncomingCall;
