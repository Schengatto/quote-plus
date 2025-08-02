import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/layouts/Layout";
import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { AuthenticatedUser } from "@/types/api/users";
import { doActionWithLoader } from "@/utils/actions";
import { genericDeleteItemsDialog } from "@/utils/dialog";
import { User, UserRole } from "@prisma/client";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete } from "react-icons/md";

const UserManagementPage = () => {

    const auth = useAuth();

    const { t } = useI18nStore();
    const { setIsLoading, setDialog } = useAppStore();

    const [isInputFormActive, setIsInputFormActive] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<Partial<User>>({});
    const [users, setUsers] = useState<AuthenticatedUser[]>([]);
    const [roles, setRoles] = useState<UserRole[]>([]);

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

    const fetchUsers = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _users = await fetch("/api/users", { method: "GET" })
                .then((res) => res.json());
            setUsers(_users);
        });
    }, [setIsLoading]);

    const fetchRoles = useCallback(async () => {
        doActionWithLoader(setIsLoading, async () => {
            const _roles = await fetch("/api/roles", { method: "GET" })
                .then((res) => res.json());
            setRoles(_roles);
        });
    }, [setIsLoading]);

    useEffect(() => {
        if (!auth) return;
        fetchUsers();
        fetchRoles();
    }, [auth, fetchUsers, fetchRoles]);

    return (
        <AppLayout>
            <div className="m-2 xl:m-8">
                <div className="flex text-xl font-semibold text-gray-800 border-b pb-2 mb-4 ">
                    <span className="capitalize">{t("usersManagement.table.title")}</span>
                </div>

                {!isInputFormActive
                    ?
                    <div className="flex item-center justify-end w-full my-4">
                        <button
                            className="btn-primary"
                            onClick={handleCreateNew}>
                            <div>
                                <MdAddCircleOutline />
                            </div>
                            <div className="uppercase font-bold text-sm">{t("usersManagement.button.addUser")}</div>
                        </button>
                    </div>
                    :
                    <div className="card mb-4">
                        <div className="font-semibold first-letter:capitalize">
                            {t("usersManagement.button.addUser")}
                        </div>

                        <div>
                            <form className="w-full" onSubmit={handleSave}>
                                <div className="w-full my-4">
                                    <div className="field-label">{t("usersManagement.form.username")}</div>
                                    <input
                                        type="text"
                                        required
                                        className="text-input"
                                        onChange={handleNameChanged} />
                                </div>
                                <div className='w-full my-4'>
                                    <div className='field-label'>{t("usersManagement.form.password")}</div>
                                    <input
                                        type="text"
                                        required
                                        className="text-input"
                                        onChange={handlePasswordChanged} />
                                </div>

                                <div className='w-full my-4'>
                                    <div className='field-label'>{t("usersManagement.form.role")}</div>
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
                                        <div className="uppercase font-bold text-sm">{t("common.cancel")}</div>
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn-primary">
                                        <div className="uppercase font-bold text-sm">{t("usersManagement.button.save")}</div>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                }

                <table className="min-w-full text-sm border rounded-md shadow-sm overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">{t("usersManagement.table.head.username")}</th>
                            <th className="px-4 py-3 text-left">{t("usersManagement.table.head.roleName")}</th>
                            <th className="px-4 py-3 text-left"></th>
                            {/* <th className="px-4 py-3 text-left"></th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u: AuthenticatedUser) =>
                            <tr key={u.id} className="table-row hover:!bg-white hover:!text-black !cursor-auto">
                                <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{u.username}</td>
                                <td className="mx-2 text-sm font-bold p-3 w-auto truncate max-w-0">{u.userRole.name}</td>
                                {/* <td className="w-10 cursor-pointer " onClick={(e) => handleEdit(e, u)}><div><MdEdit /></div></td> */}
                                <td className="w-10 cursor-pointer text-red-600" onClick={(e) => handleDelete(e, u)}><MdDelete /></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
};

export default UserManagementPage;