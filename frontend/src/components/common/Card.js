import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'normal',
  hover = false,
  clickable = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg shadow';
  const paddingClasses = {
    none: '',
    small: 'p-3',
    normal: 'p-6',
    large: 'p-8',
  };
  const hoverClasses = hover ? 'transition duration-150 ease-in-out hover:shadow-md' : '';
  const clickableClasses = clickable ? 'cursor-pointer' : '';

  return (
    <div
      className={`
        ${baseClasses}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${clickableClasses}
        ${className}
      `}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {/* Card Header */}
      {(title || subtitle) && (
        <div className={`${!padding || padding === 'none' ? 'p-6' : ''}`}>
          {title && (
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className={`${(title || subtitle) && (!padding || padding === 'none') ? 'px-6 pb-6' : ''}`}>
        {children}
      </div>

      {/* Card Actions */}
      {actions && (
        <div className={`
          ${!padding || padding === 'none' ? 'px-6 py-4' : 'mt-6'}
          flex items-center justify-end space-x-3 border-t border-gray-200
        `}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default Card; 