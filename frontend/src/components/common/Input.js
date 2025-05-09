import React, { forwardRef } from 'react';

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  required = false,
  disabled = false,
  id,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  ...props
}, ref) => {
  const baseClasses = 'block w-full rounded-md shadow-sm focus:outline-none sm:text-sm';
  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
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
        <input
          ref={ref}
          type={type}
          id={id || name}
          name={name}
          className={`${baseClasses} ${stateClasses}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          {...props}
        />
        {type === 'password' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {/* Add password visibility toggle if needed */}
          </div>
        )}
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

Input.displayName = 'Input';

export default Input; 