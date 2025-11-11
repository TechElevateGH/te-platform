import React, { useState } from 'react';


const AutoSuggest = ({ name, handler, data }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const updateSuggestions = (value) => {
        setInputValue(value);
        if (value.length > 0) {
            const filteredSuggestions = data.filter((item) =>
                item.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const renderSuggestions = () => {
        return (
            <div className="w-full">
                {
                    suggestions.length > 0 && (
                        <ul className="mt-1 z-10 w-full  absolute  max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className="py-2 relative cursor-pointer p-1 border hover:text-sky-700"
                                    onClick={() => selectSuggestion(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )
                }
            </div>
        )
    };

    const selectSuggestion = (value) => {
        setInputValue(value);
        handler({ "name": name, "value": value });
        setSuggestions([]);
    };

    return (
        <div>
            <input
                type="text"
                value={inputValue}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
                onChange={(e) => updateSuggestions(e.target.value)}
                onBlur={() => {
                    setTimeout(() => setSuggestions([]), 200);
                }}
            />
            {renderSuggestions()}
        </div>

    )
};


export default AutoSuggest;