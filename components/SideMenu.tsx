import { useAuth } from "@/hooks/useAuth";
import { useI18nStore } from "@/store/i18n";
import { useRouter } from "next/navigation";
import { FunctionComponent } from "react";
import {
    MdBugReport,
    MdBuild,
    MdList,
    MdManageAccounts,
    MdOutlineEdit,
    MdOutlineFolderOpen,
    MdOutlineHouse,
    MdPhone,
    MdSearch,
    MdSettings,
    MdShoppingCart,
    MdStorage
} from "react-icons/md";

const SideMenu: FunctionComponent = () => {
    const { userData } = useAuth();
    const router = useRouter();

    const { t } = useI18nStore();

    const navigateTo = (page: string) => {
        router.push(page);
    };

    const hasGrants = (grants: string[]) => userData?.userRole.grants?.some(g => grants.includes(g));
    interface MenuItemProps {
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
    }

    const MenuItem = ({ icon, label, onClick }: MenuItemProps) => (
        <div
            onClick={onClick}
            className="flex items-center gap-3 py-2 px-4 hover:bg-slate-700 cursor-pointer transition-colors"
        >
            <div className="text-xl text-sky-400">{icon}</div>
            <span className="uppercase text-sm text-white">{label}</span>
        </div>
    );

    interface SectionProps {
        title: string;
        children: React.ReactNode;
    }

    const MenuSection = ({ title, children }: SectionProps) => (
        <div className="w-full">
            <h4 className="uppercase text-xs text-gray-400 font-semibold px-4 mb-1 tracking-wide">{title}</h4>
            {children}
        </div>
    );

    return (
        <div className="bg-slate-900 w-[300px] h-full py-2 flex flex-col justify-between">
            <div className="bg-slate-900 w-full h-full space-y-4">
                <MenuItem
                    icon={<MdOutlineHouse />}
                    label={t("sideMenu.item.home")}
                    onClick={() => navigateTo("/home")}
                />

                {hasGrants(["quotes"]) && (
                    <MenuSection title={t("sideMenu.item.quotes")}>
                        <MenuItem
                            icon={<MdOutlineEdit />}
                            label={t("sideMenu.item.newQuote")}
                            onClick={() => navigateTo("/quotes/create")}
                        />
                        <MenuItem
                            icon={<MdOutlineFolderOpen />}
                            label={t("sideMenu.item.quotesArchive")}
                            onClick={() => navigateTo("/quotes")}
                        />
                    </MenuSection>
                )}

                {hasGrants(["categories", "brands", "products"]) && (
                    <MenuSection title={t("sideMenu.item.catalog")}>
                        {hasGrants(["categories"]) && (
                            <MenuItem
                                icon={<MdStorage />}
                                label={t("sideMenu.item.categories")}
                                onClick={() => navigateTo("/categories")}
                            />
                        )}
                        {hasGrants(["products"]) && (
                            <MenuItem
                                icon={<MdStorage />}
                                label={t("sideMenu.item.products")}
                                onClick={() => navigateTo("/products")}
                            />
                        )}
                        {hasGrants(["brands"]) && (
                            <MenuItem
                                icon={<MdStorage />}
                                label={t("sideMenu.item.brands")}
                                onClick={() => navigateTo("/brands")}
                            />
                        )}
                    </MenuSection>
                )}

                <MenuSection title={t("sideMenu.item.contacts")}>
                    <MenuItem
                        icon={<MdPhone />}
                        label={t("sideMenu.item.contactsList")}
                        onClick={() => navigateTo("/contacts")}
                    />
                    <MenuItem
                        icon={<MdList />}
                        label={t("sideMenu.item.notesList")}
                        onClick={() => navigateTo("/contacts/notes")}
                    />
                </MenuSection>

                {hasGrants(["storage"]) && (
                    <MenuSection title={t("sideMenu.item.storage")}>
                        <MenuItem
                            icon={<MdSearch />}
                            label={t("sideMenu.item.storageSearch")}
                            onClick={() => navigateTo("/storage")}
                        />
                        <MenuItem
                            icon={<MdShoppingCart />}
                            label={t("sideMenu.item.sales")}
                            onClick={() => navigateTo("/storage/create?type=sale")}
                        />
                        <MenuItem
                            icon={<MdBuild />}
                            label={t("sideMenu.item.repairs")}
                            onClick={() => navigateTo("/storage/create?type=repair")}
                        />
                    </MenuSection>
                )}

                {hasGrants(["users-management", "tenant-config"]) && (
                    <MenuSection title={t("sideMenu.item.admin")}>
                        {hasGrants(["users-management"]) && (
                            <MenuItem
                                icon={<MdManageAccounts />}
                                label={t("sideMenu.item.usersManagement")}
                                onClick={() => navigateTo("/users-management")}
                            />
                        )}
                        {hasGrants(["tenant-config"]) && (
                            <MenuItem
                                icon={<MdSettings />}
                                label={t("sideMenu.item.settings")}
                                onClick={() => navigateTo("/settings")}
                            />
                        )}
                    </MenuSection>
                )}

            </div>
            <div className="pt-4 border-t border-slate-700">
                <a
                    href="https://t.me/Enrico_Schengatto/url?url=&text=Ciao%20Enrico%2C%20segnalo%20un%20bug%20in%20QuotePlus%3A%20[descrizione]"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-2 px-4 rounded-md hover:bg-slate-700 transition-colors text-white"
                >
                    <div className="text-xl text-sky-400"><MdBugReport /></div>
                    <span className="uppercase text-sm">Segnala un bug</span>
                </a>
            </div>
        </div>
    );
};

export default SideMenu;