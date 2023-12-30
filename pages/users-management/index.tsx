import TextEditor from "@/components/TextEditor";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { AuthenticatedUser } from "@/types/api/users";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { User, UserRole } from "@prisma/client";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete, MdEdit } from "react-icons/md";

const UserManagementPage = () => {

    const auth = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [ isInputFormActive, setIsInputFormActive ] = useState<boolean>(false);
    const [ selectedUser, setSelectedUser ] = useState<Partial<User>>({});
    const [ users, setUsers ] = useState<AuthenticatedUser[]>([]);
    const [ roles, setRoles ] = useState<UserRole[]>([]);

    const handleCreateNew = () => {
        if (!auth) return;
        setSelectedUser({ username: undefined, password: undefined, userRoleId: undefined });
        setIsInputFormActive(true);
    };

    const handleNameChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSelectedUser((prev) => ({ ...prev, username: e.target.value }));
    };

    const handlePasswordChanged = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        setSelectedUser((prev) => ({ ...prev, password: e.target.value }));
    };

    const handleRoleIdChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault();
        const roleId = e.currentTarget.value;
        setSelectedUser((prev: Partial<AuthenticatedUser>) => ({ ...prev, userRoleId: roleId }));
    };

    const handleBack = () => {
        setSelectedUser({});
        setIsInputFormActive(false);
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log(selectedUser);
        if (selectedUser === null || !selectedUser.username || !selectedUser.password || !selectedUser.userRoleId) return;

        try {
            const response = await fetch("/api/users", { method: "POST", body: JSON.stringify(selectedUser) })
                .then((res) => res.json());

            if (!response.id) {
                alert(`${t("common.error.onSave")}, ${response.message}`);
            }
        } catch (error: any) {
            alert(`${t("common.error.onSave")}, ${error.message}`);
        }
        await fetchUsers();
        setIsInputFormActive(false);
    };

    const handleDelete = async (event: any, template: User) => {
        event.stopPropagation();
        await genericDeleteItemsDialog(() => deleteUser(template), t)
            .then(content => setDialog(content));
    };

    const deleteUser = async (template: User) => {
        setDialog(null);
        await fetch(`/api/users/${template.id}`, { method: "DELETE" });
        await fetchUsers();
    };

    const fetchUsers = async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _users = await fetch("/api/users", { method: "GET" })
                .then((res) => res.json());
            setUsers(_users);
        });
    };

    const fetchRoles = async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _roles = await fetch("/api/roles", { method: "GET" })
                .then((res) => res.json());
            setRoles(_roles);
        });
    };

    useEffect(() => {
        if (!auth) return;
        fetchUsers();
        fetchRoles();
    }, [ auth ]);

    return (
        <AppLayout>
            <div className="m-8">
                <table className="items-table">
                    <thead className="table-header">
                        <tr>
                            <th colSpan={3} className="text-white uppercase p-2 text-lg">{t("usersManagement.table.title")}</th>
                        </tr>
                        <tr className="bg-gray-700">
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("usersManagement.table.head.username")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left">{t("usersManagement.table.head.roleName")}</th>
                            <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th>
                            {/* <th className="mx-2 text-white uppercase p-3 text-lg text-left"></th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u: AuthenticatedUser) =>
                            <tr key={u.id} className="table-row hover:!bg-white hover:!text-black !cursor-auto">
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{u.username}</td>
                                <td className="mx-2 text-lg font-bold p-3 w-auto truncate max-w-0">{u.userRole.name}</td>
                                {/* <td className="w-10 cursor-pointer " onClick={(e) => handleEdit(e, u)}><div><MdEdit /></div></td> */}
                                <td className="w-10 cursor-pointer text-red-600" onClick={(e) => handleDelete(e, u)}><MdDelete /></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {!isInputFormActive
                ?
                <div className="flex item-center justify-center w-full">
                    <button
                        className="btn-primary"
                        onClick={handleCreateNew}>
                        <div>
                            <MdAddCircleOutline />
                        </div>
                        <div className="uppercase font-bold text-lg">{t("usersManagement.button.addUser")}</div>
                    </button>
                </div>
                :
                <div className="m-8">
                    <div className="card-header">{t("usersManagement.form.title")}</div>
                    <div className="card-body">
                        <form className="w-[90%]" onSubmit={handleSave}>
                            <div className="w-full my-4">
                                <div className="font-extrabold text-lg uppercase">{t("usersManagement.form.username")}</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handleNameChanged} />
                            </div>
                            <div className='w-full my-4'>
                                <div className='font-extrabold text-lg uppercase'>{t("usersManagement.form.password")}</div>
                                <input
                                    type="text"
                                    required
                                    className="text-input"
                                    onChange={handlePasswordChanged} />
                            </div>

                            <div className='w-full my-4'>
                                <div className='font-extrabold text-lg uppercase'>{t("usersManagement.form.role")}</div>
                                <select className='text-input'
                                    required
                                    onChange={handleRoleIdChanged} >
                                    <option value={undefined}></option>
                                    {roles.map(r => (<option key={r.id} value={r.id}>{`${r.name} » ${r.grants.join(", ")}`}</option>))}
                                </select>
                            </div>

                            <div className="flex justify-center items-center gap-2 flex-wrap">

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleBack}>
                                    <div className="uppercase font-bold text-lg">{t("common.back")}</div>
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary">
                                    <div className="uppercase font-bold text-lg">{t("usersManagement.button.save")}</div>
                                </button>

                            </div>
                        </form>
                    </div>
                </div>}
        </AppLayout>
    );
};

export default UserManagementPage;