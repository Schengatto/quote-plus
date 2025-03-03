import { useEffect, useRef, useState } from "react";
import { MdMoreVert } from "react-icons/md";

interface RowAction {
  label: string;
  onClick: (event: any) => void;
}

type RowActionsProps = {
  actions: RowAction[];
}

const RowActions = ({ actions = [] }: RowActionsProps) => {
    const [ isOpen, setIsOpen ] = useState(false);
    const dropdownRef = useRef<any>(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Chiude il dropdown quando si clicca al di fuori
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Verifica se il click è FUORI dal dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="flex flex-col items-center justify-center w-8 h-8 text-black bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Menu opzioni"
            >
                <MdMoreVert />
            </button>

            {isOpen && (
                <div className="absolute left-1 w-40 transform z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <ul className="py-1 overflow-auto max-h-60">
                        {actions.map((action, index) => (
                            <li
                                key={index}
                                onClick={(event) => action.onClick(event)}
                                className="px-4 py-2 text-gray-800 hover:bg-blue-100 cursor-pointer capitalize"
                            >
                                {action.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default RowActions;