import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { ErrorResponseData } from "@/types/api";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { Template, User } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { MdDeleteOutline, MdOutlineSave } from "react-icons/md";
import Cookies from "universal-cookie";

const UserProfile = () => {

    const router = useRouter();
    const user = useAuth();

    const { t, setCurrentLanguage, currentLanguage } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [ templates, setTemplates ] = useState<Template[]>([]);
    const [ username, setUsername ] = useState<string>(user?.username || "");
    const [ password, setPassword ] = useState<string>(user?.password || "");
    const [ selectedTemplate, setSelectedTemplate ] = useState<number>(user?.activeTemplateId || 0);
    const [ selectedLanguage, setSelectedLanguage ] = useState<string>(currentLanguage);

    const handleUsernameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setUsername(e.target.value);
    };

    const handlePasswordChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setPassword(e.target.value);
    };

    const handleSelectedTemplateChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const templateId: number = !!e.currentTarget.value ? Number(e.currentTarget.value) : 0;
        setSelectedTemplate(templateId);
    };

    const handleSelectedLanguageChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const language: string = e.currentTarget.value;
        setSelectedLanguage(language);
    };

    const handleLogout = () => {
        const cookies = new Cookies();
        cookies.remove("token");
        router.push("/");
    };

    const handleSaveUserOptions = async () => {
        if (!user) return;
        doActionWithLoader(
            setIsLoading,
            async () => {
                const result: any | Partial<User> | ErrorResponseData = await fetch(`/api/users/${user?.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        activeTemplateId: selectedTemplate || null,
                        extraData: { ...(user.extraData as any), language: selectedLanguage }
                    })
                }).then(data => data.json());

                if (result.message) {
                    throw new Error(result.message);
                }

                setCurrentLanguage(selectedLanguage);
            },
            (error) => alert(error.message)
        );
    };

    const handleSaveAccountOptions = async () => {
        if (!user) return;
        await doActionWithLoader(
            setIsLoading,
            async () => {
                const result: any | Partial<User> | ErrorResponseData = await fetch(`/api/users/${user?.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        username: username ? username : undefined,
                        password: password ? password : undefined,
                    })
                }).then(data => data.json());

                if (result.message) {
                    throw new Error(result.message);
                }
            },
            (error) => alert(error.message)
        );
        handleLogout();
    };

    const handleDelete = async () => {
        const deleteAccount = async () => {
            setDialog(null);
            await fetch(`/api/users/${user?.id}`, { method: "DELETE" });
            handleLogout();
        };

        await genericDeleteItemsDialog(() => deleteAccount(), t)
            .then(content => setDialog(content));
    };

    const fetchUserTemplates = useCallback(async () => {
        const _templates = await fetch(`/api/templates?userId=${user!.id}`, { method: "GET" })
            .then((res) => res.json());
        setTemplates(_templates);
    }, [ user ]);

    const fetchUserInfo = useCallback(async () => {
        const _user = await fetch(`/api/users/${user?.id}`, { method: "GET" }).then(res => res.json());
        setUsername(_user?.username);
        setSelectedTemplate(_user.activeTemplateId);
    }, [ user ]);

    useEffect(() => {
        if (!user) return;

        fetchUserTemplates();
        fetchUserInfo();

    }, [ user, fetchUserInfo, fetchUserTemplates ]);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">{t("userProfile.userOptions.title")}</div>
                <div className="card-body">
                    <form className="w-[90%]">
                        <div className='w-full my-4'>
                            <div className='font-extrabold text-sm uppercase'>{t("userProfile.form.activeTemplate")}</div>
                            <select className='text-input'
                                required
                                value={selectedTemplate || ""}
                                onChange={handleSelectedTemplateChanged} >
                                <option value={undefined}></option>
                                {templates.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>

                        <div className='w-full my-4'>
                            <div className='font-extrabold text-sm uppercase'>{t("options.form.language")}</div>
                            <select className='text-input'
                                required
                                value={selectedLanguage}
                                onChange={handleSelectedLanguageChanged} >
                                <option value="en">English</option>
                                <option value="it">Italiano</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsche</option>
                                <option value="es">Español</option>
                            </select>
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleSaveUserOptions}>
                                <div>
                                    <MdOutlineSave />
                                </div>
                                <div className="uppercase font-bold text-sm">{t("userProfile.button.saveAccount")}</div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="m-8">
                <div className="card-header">{t("userProfile.accountOptions.title")}</div>
                <div className="card-body">
                    <form className="w-[90%]">
                        <div className="w-full my-4">
                            <div className="font-extrabold text-sm uppercase">{t("userProfile.form.username")}</div>
                            <input
                                value={username}
                                type='text'
                                className='text-input'
                                onChange={handleUsernameChanged}
                            />
                        </div>
                        <div className="w-full my-4">
                            <div className="font-extrabold text-sm uppercase">{t("userProfile.form.password")}</div>
                            <input
                                value={password}
                                type='password'
                                className='text-input'
                                onChange={handlePasswordChanged}
                            />
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            {user?.userRole.grants?.includes("delete-account") &&
                                <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={handleDelete}>
                                    <div>
                                        <MdDeleteOutline />
                                    </div>
                                    <div className="uppercase font-bold text-sm">{t("userProfile.button.deleteAccount")}</div>
                                </button>
                            }

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleSaveAccountOptions}>
                                <div>
                                    <MdOutlineSave />
                                </div>
                                <div className="uppercase font-bold text-sm">{t("userProfile.button.saveAccount")}</div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default UserProfile;