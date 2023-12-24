import { useAppStore } from "@/store/app";
import { FunctionComponent } from "react";
import { MdWarning } from "react-icons/md";

export interface DialogAction {
    name: string;
    callback: () => void;
}

export interface DialogProps {
    title: string;
    message: string;
    closeActionLabel: string;
    actions?: DialogAction[];
}

const Dialog: FunctionComponent = () => {
    const { dialog, setDialog } = useAppStore();

    return (
        <>
            {dialog &&
                <>
                    <div className="w-full min-h-[100vh] items-center justify-center h-full bg-[#1e6bd769] fixed z-20">
                        <div className="bg-gray-900 text-white w-[600px] m-auto mt-[30vh] p-4 border-4 border-red-500">
                            <div className="flex">
                                <div className="text-yellow-400 text-4xl mr-4">
                                    <MdWarning />
                                </div>
                                <div>
                                    <div className="uppercase text-2xl">{dialog.title}</div>
                                    <div className="text-xl">{dialog.message}</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center mt-4 gap-2">
                                <button className="btn-secondary uppercase" onClick={() => setDialog(null)}>
                                    {dialog?.closeActionLabel}
                                </button>
                                {dialog.actions?.map((a, index) => (
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