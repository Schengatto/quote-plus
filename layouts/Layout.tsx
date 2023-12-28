import SideMenu from "@/components/SideMenu";
import { useAuth } from "@/hooks/useAuth";
import { useI18nStore } from "@/store/i18n";
import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import { MdMenu, MdMenuOpen } from "react-icons/md";

interface LayoutProps {
    children: ReactNode
}

const AppLayout: React.FunctionComponent<LayoutProps> = ({ children }) => {

    const auth = useAuth();

    const { t, setCurrentLanguage } = useI18nStore();
    const [isMenuVisible, setIsMenuVisible] = useState<boolean>(true);

    const toggleMenu = () => {
        setIsMenuVisible((prev: boolean) => !prev);
    };

    useEffect(() => {
        if (!auth) return;
        const userLanguage = (auth?.extraData as any).language || "en";
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
                            <div className="text-lg font-bold">
                                {t("navbar.welcome")} {auth.username}
                            </div>
                            <div className="text-right">
                                <small>v. {process.env.appVersion}</small>
                            </div>
                        </div>
                    </div>
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