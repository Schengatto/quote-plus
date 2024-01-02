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

export const errorDialog = async (
    t: (key: string) => string,
    message: string
) => {
    return {
        title: t("common.warning"),
        message: t(message) || message,
        closeActionLabel: t("common.ok"),
    };
};
