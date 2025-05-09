import React, { forwardRef } from 'react';

const Select = forwardRef(({
  label,
  options = [],
  error,
  helperText,
  fullWidth = false,
  className = '',
  required = false,
  disabled = false,
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const baseClasses = 'block w-full rounded-md shadow-sm focus:outline-none sm:text-sm';
  const stateClasses = error
    ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
    : disabled
    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthClasses} ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id || name}
          name={name}
          className={`${baseClasses} ${stateClasses}`}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {(error || helperText) && (
        <p
          className={`mt-1 text-sm ${
            error ? 'text-red-600' : 'text-gray-500'
          }`}
          id={error ? `${name}-error` : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select; 