export const doActionWithLoader = async (
    setIsLoading: (flag: boolean) => void,
    action: () => void,
    onError?: (error: any) => void
) => {
    try {
        setIsLoading(true);
        await action();
    } catch (error: any) {
        if (!onError) {
            throw new Error(error);
        } else {
            console.log("ciao", error)
            await onError(error);
        }
    } finally {
        setIsLoading(false);
    }
};
