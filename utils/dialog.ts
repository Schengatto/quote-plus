export const genericDeleteItemsDialog = async (
    deleteAction: () => Promise<void>,
    t: (key: string) => string
) => {
    return {
        title: t("common.confirmAction"),
        message: t("common.confirmDelete.message"),
        closeActionLabel: t("common.cancel"),
        actions: [
            {
                name: t("common.confirm"),
                callback: deleteAction,
            },
        ],
    };
};
