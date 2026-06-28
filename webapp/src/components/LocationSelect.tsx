import React, { useState, useEffect, useRef } from 'react';
import provincesData from '../../province.json';
import wardsData from '../../ward.json';

interface LocationSelectProps {
  type: 'province' | 'ward' | 'combined';
  value: string;
  onChange: (val: string) => void;
  parentValue?: string;
  disabled?: boolean;
  placeholder?: string;
}

const provincesList = Object.values(provincesData as Record<string, any>).map(p => ({ ...p, __isProvince: true }));
const wardsList = Object.values(wardsData as Record<string, any>).map(w => ({ ...w, __isWard: true }));

export default function LocationSelect({ type, value, onChange, parentValue, disabled, placeholder }: LocationSelectProps) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeProvince, setActiveProvince] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSearchTerm(value || '');
        if (type === 'combined') {
          setActiveProvince(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, type]);

  const getFilteredOptions = () => {
    let options: any[] = [];
    
    if (type === 'province') {
      options = provincesList;
    } else if (type === 'ward') {
      const parentProvince = provincesList.find(p => p.name_with_type === parentValue);
      if (parentProvince) {
        options = wardsList.filter(w => w.parent_code === parentProvince.code);
      }
    } else if (type === 'combined') {
      if (activeProvince) {
        options = wardsList.filter(w => w.parent_code === activeProvince.code);
      } else {
        const lowerSearch = searchTerm.toLowerCase();
        if (lowerSearch && searchTerm !== value) {
          const matchedProvinces = provincesList.filter(p => p.name_with_type.toLowerCase().includes(lowerSearch) || p.name.toLowerCase().includes(lowerSearch));
          const matchedWards = wardsList.filter(w => w.name_with_type.toLowerCase().includes(lowerSearch) || w.name.toLowerCase().includes(lowerSearch) || w.path_with_type.toLowerCase().includes(lowerSearch));
          
          return [
            ...matchedProvinces,
            ...matchedWards.slice(0, 50)
          ];
        } else {
          return provincesList;
        }
      }
    }

    if (searchTerm && searchTerm !== value && type !== 'combined') {
      const lowerSearch = searchTerm.toLowerCase();
      options = options.filter(opt => 
        opt.name_with_type.toLowerCase().includes(lowerSearch) || 
        opt.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (type === 'combined' && activeProvince && searchTerm && searchTerm !== value) {
      const lowerSearch = searchTerm.toLowerCase();
      options = options.filter(opt => 
        opt.name_with_type.toLowerCase().includes(lowerSearch) || 
        opt.name.toLowerCase().includes(lowerSearch)
      );
    }

    return options.sort((a, b) => a.name_with_type.localeCompare(b.name_with_type));
  };

  const options = getFilteredOptions();

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        className="form-control"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '250px',
          overflowY: 'auto',
          backgroundColor: '#fff',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginTop: '4px'
        }}>
          {type === 'combined' && activeProvince && (
            <div 
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-hover, #f3f4f6)',
                fontWeight: 'bold',
                color: 'var(--primary)'
              }}
              onClick={() => {
                setActiveProvince(null);
                inputRef.current?.focus();
              }}
            >
              🔙 Quay lại chọn Tỉnh/Thành
            </div>
          )}
          {options.length > 0 ? (
            options.map((opt, idx) => {
              const displayLabel = type === 'combined' && opt.__isWard && !activeProvince ? opt.path_with_type : opt.name_with_type;
              
              return (
                <div
                  key={opt.code || idx}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: idx === options.length - 1 ? 'none' : '1px solid #eee',
                    backgroundColor: value === displayLabel ? '#e0f2fe' : 'transparent',
                    color: 'var(--text-main)',
                    fontSize: opt.__isWard && type === 'combined' && !activeProvince ? '0.9em' : '1em'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = value === displayLabel ? '#e0f2fe' : 'transparent')}
                  onClick={() => {
                    if (type === 'combined' && opt.__isProvince) {
                      setActiveProvince(opt);
                      setSearchTerm('');
                      onChange(opt.name_with_type);
                      inputRef.current?.focus();
                    } else {
                      const finalValue = type === 'combined' && opt.__isWard ? opt.path_with_type : opt.name_with_type;
                      onChange(finalValue);
                      setSearchTerm(finalValue);
                      setShowDropdown(false);
                      if (type === 'combined') setActiveProvince(null);
                    }
                  }}
                >
                  {displayLabel}
                  {type === 'combined' && opt.__isProvince && (
                    <span style={{ float: 'right', color: 'var(--text-muted)' }}>▶</span>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {type === 'ward' && !parentValue ? 'Vui lòng chọn Tỉnh/Thành trước' : 'Không tìm thấy kết quả'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
