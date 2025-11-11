import React, { useState } from 'react';
import Autosuggest from 'react-autosuggest';


const Typeahead = ({ name, value, data, handler }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [currentValue, setCurrentValue] = useState(value || "");


    const getSuggestions = (inputValue) => {
        const inputValueLowerCase = inputValue.trim().toLowerCase();
        return data.filter((entry) =>
            entry.toLowerCase().includes(inputValueLowerCase)
        );
    };

    const getSuggestionValue = (suggestion) => suggestion;

    const onSuggestionsFetchRequested = ({ value }) => {
        setSuggestions(getSuggestions(value));
    };

    const onSuggestionsClearRequested = () => {
        setSuggestions([]);
    };

    const onKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                navigateSuggestions(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                navigateSuggestions(-1);
                break;
            default:
                break;
        }
    };

    const navigateSuggestions = (step) => {
        const currentIndex = suggestions.indexOf(currentValue);
        const newIndex = currentIndex + step;

        if (newIndex >= 0 && newIndex < suggestions.length) {
            setCurrentValue(suggestions[newIndex]);
        }
        else if (newIndex === suggestions.length) {
            setCurrentValue(suggestions[0]);
        }
        else if (newIndex === -1) {
            setCurrentValue(suggestions[suggestions.length - 1]);
        }
    };


    const inputProps = {
        name: name,
        value: currentValue,
        onChange: (_, { newValue }) => {
            setCurrentValue(newValue);
            handler({ "name": name, "value": newValue });
        },
        className: "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6",
        onKeyDown
    };


    return (
        <>
            <div className='relative'>
                <Autosuggest
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={onSuggestionsClearRequested}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={() => { }}
                    inputProps={inputProps}
                />
                {suggestions.length > 0 && (
                    <ul className="suggestions-list mt-1 p-1 absolute w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className={`py-2 cursor-pointer hover:text-sky-700 ${currentValue === suggestion ? 'text-sky-700' : ''}`}
                                onMouseDown={() => {
                                    setCurrentValue(suggestion);
                                    handler({ "name": name, "value": suggestion });
                                }}
                            >
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default Typeahead;
