import React from "react";
import Cookies from "universal-cookie";
import { useRouter } from "next/navigation";
import AppLayout from "@/layouts/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useI18nStore } from "@/store/i18n";
import { MdEdit, MdLogout, MdOutlineFolderOpen } from "react-icons/md";

const Home = () => {
    const router = useRouter();
    const user = useAuth();

    const { t } = useI18nStore();

    const handleLogout = () => {
        const cookies = new Cookies();
        cookies.remove("token");
        router.push("/");
    };

    const menuItems = [
        { label: "sideMenu.item.newQuote", icon: MdEdit, grant: "quotes", onClick: () => router.push("/quotes/create", { scroll: false }) },
        { label: "sideMenu.item.quotesArchive", icon: MdOutlineFolderOpen, grant: "quotes", onClick: () => router.push("/quotes", { scroll: false }) },
        { label: "sideMenu.item.categories", icon: MdEdit, grant: "categories", onClick: () => router.push("/categorys", { scroll: false }) },
        { label: "sideMenu.item.products", icon: MdEdit, grant: "products", onClick: () => router.push("/products", { scroll: false }) },
        { label: "sideMenu.item.brands", icon: MdEdit, grant: "brands", onClick: () => router.push("/brands", { scroll: false }) },
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