import { FunctionComponent } from "react";
import { useI18nStore } from "@/store/i18n";
import { useRouter } from "next/navigation";
import { MdOutlineEdit, MdOutlineHouse, MdOutlineFolderOpen, MdExitToApp } from "react-icons/md";
import { useAuthStore } from "@/store/auth";

const SideMenu: FunctionComponent = () => {
    const { t } = useI18nStore();
    const { logout } = useAuthStore();

    const router = useRouter();

    const navigateTo = (page: string) => {
        router.push(page);
    };

    const handleLogout = () => {
        window.localStorage.removeItem("user");
        logout();
        router.push("/");
    };

    return (
        <>
            <div className="bg-sky-800 w-[98%] overflow-hidden">
                <div className="w-full">
                    <div className="side-menu__item"
                        onClick={() => navigateTo("/home")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineHouse /></div>
                        <div className="ml-2">{t("sideMenu.item.home")}</div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="side-menu__category">{t("sideMenu.item.quotes")}</div>
                    <div className="side-menu__item" onClick={() => navigateTo("/quote/create")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineEdit /></div>
                        <div className="ml-2">{t("sideMenu.item.newQuote")}</div>
                    </div>
                    <div className="side-menu__item" onClick={() => navigateTo("/quote")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineFolderOpen /></div>
                        <div className="ml-2">{t("sideMenu.item.quotesArchive")}</div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="side-menu__category">{t("sideMenu.item.catalog")}</div>
                    <div className="side-menu__item"
                        onClick={() => navigateTo("/category")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineEdit /></div>
                        <div className="ml-2">{t("sideMenu.item.categories")}</div>
                    </div>
                    <div className="side-menu__item"
                        onClick={() => navigateTo("/product")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineEdit /></div>
                        <div className="ml-2 ">{t("sideMenu.item.products")}</div>
                    </div>
                    <div className="side-menu__item"
                        onClick={() => navigateTo("/brand")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineEdit /></div>
                        <div className="ml-2 ">{t("sideMenu.item.brands")}</div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="side-menu__category">{t("sideMenu.item.user")}</div>
                    <div className="side-menu__item"
                        onClick={() => navigateTo("/profile")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineEdit /></div>
                        <div className="ml-2 ">{t("sideMenu.item.editUserOptions")}</div>
                    </div>
                    <div className="side-menu__item"
                        onClick={() => navigateTo("/template")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineEdit /></div>
                        <div className="ml-2 ">{t("sideMenu.item.manageTemplates")}</div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="side-menu__category">{t("sideMenu.item.appOptions")}</div>
                    <div className="side-menu__item "
                        onClick={() => navigateTo("/options")}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdOutlineEdit /></div>
                        <div className="ml-2 ">{t("sideMenu.item.editAppOptions")}</div>
                    </div>
                    <div className="side-menu__item"
                        onClick={handleLogout}>
                        <div className="ml-5 flex flex-col items-center justify-center"><MdExitToApp /></div>
                        <div className="ml-2 ">{t("sideMenu.item.logout")}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SideMenu;