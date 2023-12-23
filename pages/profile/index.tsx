import AppLayout from "@/layouts/Layout";
import { useAuthStore } from "@/store/auth";
import { useI18nStore } from "@/store/i18n";
import { Template } from "@prisma/client";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { MdDeleteOutline, MdOutlineSave } from "react-icons/md";

const UserProfile = () => {

    const router = useRouter();
    const { t } = useI18nStore();
    const { user, logout, login } = useAuthStore();

    const [ username, setUsername ] = useState<string>(user?.username || "");
    const [ password, setPassword ] = useState<string>(user?.password || "");
    const [ selectedTemplate, setSelectedTemplate ] = useState<number>(user?.activeTemplateId || 0);
    const [ templates, setTemplates ] = useState<Template[]>([]);

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

    const handleSave = async () => {
        await fetch(`/api/user/${user?.id}`, {
            method: "PATCH", body: JSON.stringify({
                ...user,
                username: username || user?.username,
                password: password || user?.password,
                activeTemplateId: selectedTemplate || null
            })
        });

        const _user = await fetch(`/api/user/${user?.id}`, { method: "GET" }).then(res => res.json());
        login(_user);
    };

    const handleDelete = async () => {
        await fetch(`/api/user/${user?.id}`, { method: "DELETE" });
        logout();
    };

    const fetchUserTemplates = async () => {
        const _templates = await fetch(`/api/template?userId=${user!.id}`, { method: "GET" })
            .then((res) => res.json());
        setTemplates(_templates);
    };

    const fetchUserInfo = async () => {
        const _user = await fetch(`/api/user/${user?.id}`, { method: "GET" }).then(res => res.json());
        setUsername(_user?.username);
        setSelectedTemplate(_user.activeTemplateId);
    };

    useEffect(() => {
        if (!user) return;

        fetchUserTemplates();
        fetchUserInfo();

    }, []);

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">{t("userProfile.form.title")}</div>
                <div className="card-body">
                    <form className="w-[90%]">
                        <div className="w-full my-4">
                            <div className="font-extrabold text-lg uppercase">{t("userProfile.form.username")}</div>
                            <input
                                value={username}
                                type='text'
                                className='text-input'
                                onChange={handleUsernameChanged}
                            />
                        </div>
                        <div className="w-full my-4">
                            <div className="font-extrabold text-lg uppercase">{t("userProfile.form.password")}</div>
                            <input
                                value={password}
                                type='password'
                                className='text-input'
                                onChange={handlePasswordChanged}
                            />
                        </div>
                        <div className='w-full my-4'>
                            <div className='font-extrabold text-lg uppercase'>{t("userProfile.form.activeTemplate")}</div>
                            <select className='text-input'
                                required
                                value={selectedTemplate}
                                onChange={handleSelectedTemplateChanged} >
                                <option value={undefined}></option>
                                {templates.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                        </div>
                        <div className="flex justify-center items-center gap-4">
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDelete}>
                                <div>
                                    <MdDeleteOutline />
                                </div>
                                <div className="uppercase font-bold text-lg">{t("userProfile.button.deleteAccount")}</div>
                            </button>

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleSave}>
                                <div>
                                    <MdOutlineSave />
                                </div>
                                <div className="uppercase font-bold text-lg">{t("userProfile.button.saveAccount")}</div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default UserProfile;