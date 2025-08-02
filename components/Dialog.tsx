import { useAppStore } from "@/store/app";
import { useI18nStore } from "@/store/i18n";
import { FunctionComponent, ReactNode, useEffect } from "react";
import { MdWarning, MdInfo, MdError, MdCheckCircle, MdClose } from "react-icons/md";

export interface DialogAction {
    name: string;
    callback: () => void;
    variant?: "primary" | "secondary" | "danger";
}

export type DialogType = "info" | "warning" | "error" | "success";

export interface DialogProps {
    isVisible?: boolean;
    title?: string;
    message?: string;
    type?: string;
    closeActionLabel?: string;
    actions?: DialogAction[];
    children?: ReactNode;
    showCloseButton?: boolean;
    onClose?: () => void;
}

const Dialog: FunctionComponent<DialogProps> = (props: DialogProps) => {
    const { dialog, setDialog } = useAppStore();
    const { t } = useI18nStore();

    const actions = props.actions || dialog?.actions;
    const isDialogVisible = props.isVisible || dialog;
    const dialogType = props.type ||  dialog?.type || "info";

    const typeConfig = {
        info: {
            icon: MdInfo,
            iconColor: "text-blue-500",
            borderColor: "border-blue-500/30",
            bgAccent: "bg-blue-500/10"
        },
        warning: {
            icon: MdWarning,
            iconColor: "text-yellow-500",
            borderColor: "border-yellow-500/30",
            bgAccent: "bg-yellow-500/200"
        },
        error: {
            icon: MdError,
            iconColor: "text-red-500",
            borderColor: "border-red-500/30",
            bgAccent: "bg-red-500/200"
        },
        success: {
            icon: MdCheckCircle,
            iconColor: "text-green-500",
            borderColor: "border-green-500/30",
            bgAccent: "bg-green-500/200"
        }
    };

    const config = typeConfig[dialogType as DialogType];
    const IconComponent = config.icon;

    const handleClose = () => {
        if (props.onClose) {
            props.onClose();
        } else {
            setDialog(null);
        }
    };

    const getButtonClasses = (variant: DialogAction["variant"] = "primary") => {
        const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";

        switch (variant) {
            case "primary":
                return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
            case "secondary":
                return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500`;
            case "danger":
                return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;
            default:
                return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isDialogVisible) {
                handleClose();
            }
        };

        if (isDialogVisible) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isDialogVisible]);

    if (!isDialogVisible) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div
                className={`
                    relative w-full max-w-md mx-auto bg-gray-800 rounded-xl shadow-2xl 
                    border ${config.borderColor} ${config.bgAccent}
                    transform transition-all duration-300 ease-out
                    animate-in fade-in zoom-in-95
                `}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start p-6 pb-4">
                    <div className={`flex-shrink-0 ${config.iconColor} text-2xl mr-4 mt-1`}>
                        <IconComponent />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white leading-tight capitalize">
                            {props.title || dialog?.title || "Attenzione"}
                        </h3>
                        {(props.message || dialog?.message) && (
                            <p className="mt-2 text-gray-300 text-sm leading-relaxed">
                                {props.message || dialog?.message}
                            </p>
                        )}
                    </div>

                    {(props.showCloseButton !== false) && (
                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 ml-4 p-1 text-gray-400 hover:text-white transition-colors duration-200 rounded-full hover:bg-gray-700"
                            aria-label="Chiudi dialog"
                        >
                            <MdClose size={20} />
                        </button>
                    )}
                </div>

                {props.children && (
                    <div className="px-6 pb-4">
                        {props.children}
                    </div>
                )}

                {(actions && actions?.length > 0 || dialog?.closeActionLabel) && (
                    <div className="flex flex-col sm:flex-row gap-3 p-6 pt-4 border-t border-gray-700">
                        <div className="flex flex-wrap gap-2 justify-end flex-1">
                            {dialog?.closeActionLabel && (
                                <button
                                    className={getButtonClasses("secondary")}
                                    onClick={handleClose}
                                >
                                    <span className="capitalize">{dialog.closeActionLabel}</span>
                                </button>
                            )}
                            {actions?.map((action, index) => (
                                <button
                                    key={index}
                                    className={getButtonClasses(action.variant)}
                                    onClick={() => {
                                        action.callback();
                                        if (!action.variant || action.variant !== "danger") {
                                            handleClose();
                                        }
                                    }}
                                >
                                    <span className="capitalize">{action.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dialog;