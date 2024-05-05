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
        setCurrentLanguage(userLanguage );
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
                    <div className="h-[7vh] min-h-[4.5em] z-10 fixed w-full bg-gray-900 text-white uppercase flex justify-between p-4">
                        <div>
                            <button className="side-menu__toggle-button"
                                type="button"
                                onClick={toggleMenu}>
                                {isMenuVisible ? <MdMenuOpen /> : <MdMenu />}
                            </button>
                        </div>
                        <div>
                            <div className="side-menu__item p-1 text-lg font-bold cursor-pointer flex bg-slate-600" onClick={toggleUserMenu}>
                                <div className="mr-2 mt-1"><MdOutlineAccountCircle /></div>
                                <div> {auth.username}</div>
                            </div>
                        </div>
                    </div>
                    {isUserMenuVisible 
                        && <div className="bg-sky-800 fixed z-10 right-0 top-14">
                            <div className="w-full">
                                <div className="side-menu__item"
                                    onClick={() => navigateTo("/profile")}>
                                    <div className="ml-2 ">{t("sideMenu.item.editUserOptions")}</div>
                                </div>
                                <div className="side-menu__item"
                                    onClick={() => navigateTo("/templates")}>
                                    <div className="ml-2 ">{t("sideMenu.item.manageTemplates")}</div>
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="side-menu__item"
                                    onClick={handleLogout}>
                                    <div className="ml-2 ">{t("sideMenu.item.logout")}</div>
                                </div>
                            </div>
                        </div>}
                    <div className="flex bg-gray-900">
                        {isMenuVisible &&
                            <div className="fixed top-[7vh] md:sticky h-[93vh] w-[400px] flex flex-col items-center text-white bg-gray-900 z-10">
                                <SideMenu />
                            </div>
                        }
                        <div className="w-full mt-[7vh] bg-gradient-to-r from-cyan-500 to-blue-500 min-h-[93vh]">
                            {children}
                        </div>
                    </div>
                </main>}
        </>)
};

export default AppLayout;