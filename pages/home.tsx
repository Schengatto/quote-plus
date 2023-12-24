import AppLayout from "@/layouts/Layout";
import { MdEdit, MdLogout, MdOutlineFolderOpen } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useI18nStore } from "@/store/i18n";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import Cookies from "universal-cookie";
import { useAppStore } from "@/store/app";

const Home = () => {
    const router = useRouter();
    const user = useAuth();

    const { setDialog } = useAppStore();
    const { t } = useI18nStore();

    const handleLogout = () => {
        const cookies = new Cookies();
        cookies.remove("token");
        router.push("/");
    };

    const menuItems = [
        { label: "sideMenu.item.newQuote", icon: MdEdit, grant: "quotes", onClick: () => router.push("/quote/create", { scroll: false }) },
        { label: "sideMenu.item.quotesArchive", icon: MdOutlineFolderOpen, grant: "quotes", onClick: () => router.push("/quote", { scroll: false }) },
        { label: "sideMenu.item.categories", icon: MdEdit, grant: "categories", onClick: () => router.push("/category", { scroll: false }) },
        { label: "sideMenu.item.products", icon: MdEdit, grant: "products", onClick: () => router.push("/product", { scroll: false }) },
        { label: "sideMenu.item.brands", icon: MdEdit, grant: "brands", onClick: () => router.push("brand", { scroll: false }) },
        { label: "sideMenu.item.logout", icon: MdLogout, onClick: handleLogout },
    ].filter(item => !item.grant || user?.userRole.grants?.find(g => g === item.grant));

    return (
        <AppLayout>
            <div className="flex flex-col gap-2 items-center justify-center h-full">
                {
                    menuItems.map((item, index) =>
                        <button key={index}
                            className="btn-secondary !w-[350px]"
                            type="button"
                            onClick={() => item.onClick()}>
                            <div>
                                {React.createElement(item.icon)}
                            </div>
                            <div className="uppercase font-bold">{t(item.label)}</div>
                        </button>)
                }
            </div>
        </AppLayout>
    );
};

export default Home;