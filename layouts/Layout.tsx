import SideMenu from "@/components/SideMenu";
import { useAuth } from "@/hooks/useAuth";
import { useI18nStore } from "@/store/i18n";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { MdMenu, MdMenuOpen, MdOutlineAccountCircle } from "react-icons/md";
import Cookies from "universal-cookie";


interface LayoutProps {
    children: ReactNode
}

const AppLayout: React.FunctionComponent<LayoutProps> = ({ children }) => {

    const auth = useAuth();
    const router = useRouter();

    const { t, setCurrentLanguage, currentLanguage } = useI18nStore();
    const [isMenuVisible, setIsMenuVisible] = useState<boolean>(true);
    const [isUserMenuVisible, setIsUserMenuVisible] = useState<boolean>(false);

    const toggleMenu = () => {
        setIsUserMenuVisible(false);
        setIsMenuVisible((prev: boolean) => !prev);
    };

    const toggleUserMenu = () => {
        setIsUserMenuVisible((prev: boolean) => !prev);
    }

    const handleLogout = () => {
        const cookies = new Cookies();
        cookies.remove("token");
        router.push("/");
    };

    const navigateTo = (page: string) => {
        router.push(page);
    };

    useEffect(() => {
        if (!auth) return;
        const userLanguage = currentLanguage || (auth?.extraData as any).language || "en";
        setCurrentLanguage(userLanguage);
    }, [auth])

    return (
        <>
            <Head>
                <title>Quote plus</title>
                <meta
                    name="description"
                    content="Quote plus - create your quotes"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {auth &&
                <main className="bg-gray-900 h-screen">
                    <div className="h-[2.5vh] min-h-[2.5em] z-10 fixed w-full bg-gray-900 text-white uppercase flex justify-between">
                        <button className="side-menu__toggle-button ml-2"
                            type="button"
                            onClick={toggleMenu}>
                            {isMenuVisible ? <MdMenuOpen /> : <MdMenu />}
                        </button>
                        <div className="mr-1">
                            <div className="mr-2 mt-1 side-menu__item p-1 text-sm font-bold cursor-pointer flex bg-slate-600" onClick={toggleUserMenu}>
                                <div className="mr-2 mt-1"><MdOutlineAccountCircle /></div>
                                <div> {auth.username}</div>
                            </div>
                        </div>
                    </div>
                    {isUserMenuVisible
                        && <div className="bg-slate-600 fixed z-20 right-0 top-10">
                            <div className="w-full">
                                <div className="user-menu-option"
                                    onClick={() => navigateTo("/profile")}>
                                    <div className="ml-2 ">{t("sideMenu.item.editUserOptions")}</div>
                                </div>
                                <div className="user-menu-option"
                                    onClick={() => navigateTo("/templates")}>
                                    <div className="ml-2 ">{t("sideMenu.item.manageTemplates")}</div>
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="user-menu-option"
                                    onClick={handleLogout}>
                                    <div className="ml-2 ">{t("sideMenu.item.logout")}</div>
                                </div>
                            </div>
                        </div>}
                    <div className="flex bg-gray-900">
                        {isMenuVisible &&
                            <div className="fixed mt-[4vh] md:sticky h-[96vh] w-[300px] flex flex-col items-center text-white bg-gray-900 z-10">
                                <SideMenu />
                            </div>
                        }
                        <div className="w-full mt-[4vh] bg-[#F0F8FF] h-[96vh] overflow-auto">
                            {children}
                        </div>
                    </div>
                </main>}
        </>)
};

export default AppLayout;