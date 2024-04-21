import { Contact } from "@prisma/client";
import { create } from "zustand";

type ContactsStore = {
    contacts: Contact[];
    setContacts: (contacts: Contact[]) => void;
    selectedContact: Partial<Contact> | null;
    setSelectedContact: (quote: Partial<Contact> | null) => void;
};

export const useContactsStore = create<ContactsStore>((set, get) => ({
    contacts: [],
    setContacts: (contacts: Contact[]) => set({ contacts }),
    selectedContact: null,
    setSelectedContact: (contact: Partial<Contact> | null) => set({ selectedContact: contact }),
}));
