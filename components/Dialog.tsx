import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { FunctionComponent, ReactNode } from "react";
import { MdWarning } from "react-icons/md";

export interface DialogAction {
    name: string;
    callback: () => void;
}

export interface DialogProps {
    isVisible?: boolean;
    title?: string;
    message?: string;
    closeActionLabel?: string;
    actions?: DialogAction[];
    children?: ReactNode | undefined;
}

const Dialog: FunctionComponent<DialogProps> = (props: DialogProps) => {
    const { dialog, setDialog } = useAppStore();
    const { t } = useI18nStore();

    const actions = props.actions || dialog?.actions;
    const isDialogVisible = props.isVisible || dialog;

    return (
        <>
            {isDialogVisible &&
                <>
                    <div className="w-full min-h-[100vh] items-center justify-center h-full bg-[#1e6bd769] fixed z-20">
                        <div className="bg-gray-900 text-white w-[50%] m-auto mt-[30vh] p-4 border-4 border-red-500">
                            <div className="flex">
                                <div className="text-yellow-400 text-4xl mr-4">
                                    <MdWarning />
                                </div>
                                <div>
                                    <div className="uppercase text-2xl">{props.title || dialog?.title}</div>
                                    <div className="text-xl">{props.message || dialog?.message}</div>
                                </div>
                            </div>
                            <div>
                                {props.children}
                            </div>
                            <div className="flex flex-wrap justify-center mt-4 gap-2">
                                {dialog?.closeActionLabel && <button className="btn-secondary uppercase" onClick={() => setDialog(null)}>
                                    {dialog?.closeActionLabel}
                                </button>}
                                {actions?.map((a, index) => (
                                    <button key={index} className="btn-primary uppercase" onClick={a.callback}>
                                        {a.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            }
        </>
    );
};

export default Dialog;