import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  rounded = 'full',
  dot = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-0.5 text-sm',
    large: 'px-3 py-1 text-base',
  };

  const roundedClasses = {
    none: 'rounded-none',
    small: 'rounded',
    medium: 'rounded-md',
    large: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <span
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${roundedClasses[rounded]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`
            -ml-0.5 mr-1.5 h-2 w-2 rounded-full
            ${variant === 'default' ? 'bg-gray-400' : ''}
            ${variant === 'primary' ? 'bg-blue-400' : ''}
            ${variant === 'success' ? 'bg-green-400' : ''}
            ${variant === 'warning' ? 'bg-yellow-400' : ''}
            ${variant === 'danger' ? 'bg-red-400' : ''}
            ${variant === 'info' ? 'bg-indigo-400' : ''}
          `}
        />
      )}
      {children}
    </span>
  );
};

// Predefined badge variants for common use cases
Badge.Status = ({ status, ...props }) => {
  const statusConfig = {
    active: { variant: 'success', children: 'Active' },
    inactive: { variant: 'default', children: 'Inactive' },
    pending: { variant: 'warning', children: 'Pending' },
    error: { variant: 'danger', children: 'Error' },
  };

  return (
    <Badge
      dot
      {...statusConfig[status]}
      {...props}
    />
  );
};

Badge.Count = ({ count, max = 99, ...props }) => {
  const displayCount = count > max ? `${max}+` : count;
  return (
    <Badge
      variant="primary"
      size="small"
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

export default Badge; 