import { useState } from "react";

type AutoCompleteProps = {
    suggestions: string[];
    required?: boolean;
    onSelect: (value: string) => void;
};

export default function AutoComplete({ suggestions, onSelect, required = false }: AutoCompleteProps) {
    const [inputValue, setInputValue] = useState("");
    const [filtered, setFiltered] = useState<string[]>([]);
    const [showList, setShowList] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (val.length > 0) {
            const filtered = suggestions.filter((s) =>
                s.toLowerCase().includes(val.toLowerCase())
            );
            setFiltered(filtered);
            setShowList(true);
        } else {
            setFiltered([]);
            setShowList(false);
        }
        onSelect(val);
    };

    const handleSelect = (value: string) => {
        setInputValue(value);
        setShowList(false);
        onSelect(value);
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                className="text-input"
                required={required}
            />
            {showList && filtered.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border mt-1 rounded shadow-md max-h-60 overflow-auto">
                    {filtered.map((item, index) => (
                        <li
                            key={index}
                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => handleSelect(item)}
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
