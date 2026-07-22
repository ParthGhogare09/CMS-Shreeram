import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const SearchWithSuggestions = ({ value, onChange, placeholder, suggestions, onSelect, style }) => {
  const [show, setShow] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredSuggestions = [...new Set(suggestions)]
    .filter(name => 
      !value || (
        name.toLowerCase().includes(value.toLowerCase()) && 
        name.toLowerCase() !== value.toLowerCase()
      )
    )
    .slice(0, 10);

  return (
    <div ref={containerRef} className="search-suggest-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', ...style }}>
      <Search 
        size={14} 
        color="var(--color-text-muted)" 
        style={{ position: 'absolute', left: '10px', pointerEvents: 'none', zIndex: 10 }} 
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        placeholder={placeholder}
        style={{ width: '100%', paddingLeft: '2rem' }}
      />
      {show && filteredSuggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {filteredSuggestions.map((name, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => {
                if (onSelect) {
                  onSelect(name);
                } else {
                  onChange(name);
                }
                setShow(false);
              }}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchWithSuggestions;
