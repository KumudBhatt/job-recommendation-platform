import React, { forwardRef, useEffect, useRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  required = false,
  disabled = false,
  autoResize = false,
  minRows = 3,
  maxRows = 10,
  id,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  ...props
}, ref) => {
  const textareaRef = useRef(null);
  const combinedRef = (node) => {
    textareaRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const baseClasses = 'block w-full rounded-md shadow-sm focus:outline-none sm:text-sm';
  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : disabled
    ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  const widthClasses = fullWidth ? 'w-full' : '';

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;

      const adjustHeight = () => {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(Math.max(minHeight, scrollHeight), maxHeight)}px`;
      };

      adjustHeight();
      textarea.addEventListener('input', adjustHeight);
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, [autoResize, minRows, maxRows, value]);

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
        <textarea
          ref={combinedRef}
          id={id || name}
          name={name}
          className={`${baseClasses} ${stateClasses}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          rows={minRows}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
          style={autoResize ? { resize: 'none', overflow: 'hidden' } : undefined}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

export default Textarea; 