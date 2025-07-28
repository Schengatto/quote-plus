import SideMenu from "@/components/SideMenu";
import { useAuth } from "@/hooks/useAuth";
import { useI18nStore } from "@/store/i18n";
import Head from "next/head";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useState } from "react";
import { MdMenu, MdMenuOpen, MdOutlineAccountCircle } from "react-icons/md";
import Cookies from "universal-cookie";

interface LayoutProps {
    children: ReactNode;
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
    };

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
    }, [auth]);

    return (
        <>
            <Head>
                <title>Quote plus</title>
                <meta name="description" content="Quote plus - create your quotes" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {auth && (
                <main className="bg-gray-100 min-h-screen">
                    <div className="h-14 fixed top-0 z-20 w-full bg-white shadow-md flex items-center justify-between px-4">
                        <div className="flex items-center space-x-4">
                            <button
                                className="text-gray-700 hover:text-gray-900 transition-colors"
                                onClick={toggleMenu}
                            >
                                {isMenuVisible ? <MdMenuOpen size={24} /> : <MdMenu size={24} />}
                            </button>
                            <span className="text-xl font-semibold text-gray-800 tracking-wide">
                                QuotePlus
                            </span>
                        </div>
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition"
                                onClick={toggleUserMenu}
                            >
                                <MdOutlineAccountCircle size={20} />
                                <span className="text-sm text-gray-700 font-medium">
                                    {auth.username}
                                </span>
                            </button>
                        </div>
                    </div>

                    {isUserMenuVisible && (
                        <div className="bg-white border border-gray-200 rounded shadow-md fixed z-30 right-4 top-16 w-48">
                            <div className="py-2">
                                <div
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => navigateTo("/profile")}
                                >
                                    {t("sideMenu.item.editUserOptions")}
                                </div>
                                <div
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => navigateTo("/templates")}
                                >
                                    {t("sideMenu.item.manageTemplates")}
                                </div>
                                <div className="border-t my-1" />
                                <div
                                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    {t("sideMenu.item.logout")}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex pt-14">
                        {isMenuVisible && (
                            <div className="w-[300px] fixed md:sticky top-14 h-[calc(100vh-3.5rem)] bg-gray-900 text-white z-10">
                                <SideMenu />
                            </div>
                        )}
                        <div className={`flex-1 ${isMenuVisible ? "ml-[50px]" : ""} h-[calc(100vh-3.5rem)] overflow-auto`}>
                            {children}
                        </div>
                    </div>
                </main>
            )}
        </>
    );
};

export default AppLayout;
