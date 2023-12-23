import AppLayout from "@/layouts/Layout";
import { MdEdit } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useI18nStore } from "@/store/i18n";

const Home = () => {
    const router = useRouter();

    const { t } = useI18nStore();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        window.localStorage.removeItem("user");
        logout();
        router.push("/");
    };

    const menuItems = [
        { label: "sideMenu.item.newQuote", icon: "pencil", onClick: () => router.push("/quote/create", { scroll: false }) },
        { label: "sideMenu.item.quotes", icon: "folder", onClick: () => router.push("/quote", { scroll: false }) },
        { label: "sideMenu.item.categories", icon: "pencil", onClick: () => router.push("/category", { scroll: false }) },
        { label: "sideMenu.item.products", icon: "pencil", onClick: () => router.push("/product", { scroll: false }) },
        { label: "sideMenu.item.brands", icon: "pencil", onClick: () => router.push("brand", { scroll: false }) },
        { label: "sideMenu.item.logout", icon: "exit", onClick: handleLogout },
    ];

    return (
        <AppLayout>
            <div className="flex flex-col gap-2 items-center justify-center h-full">
                {menuItems.map((item, index) =>
                    <button key={index}
                        className="btn-secondary !w-[350px]"
                        type="button"
                        onClick={() => item.onClick()}>
                        <div>
                            <MdEdit />
                        </div>
                        <div className="uppercase font-bold">{t(item.label)}</div>
                    </button>)}
            </div>
        </AppLayout>
    );
};

export default Home;