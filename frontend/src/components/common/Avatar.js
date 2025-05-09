import React, { useState } from 'react';

const Avatar = ({
  src,
  alt,
  name,
  size = 'medium',
  shape = 'circle',
  status,
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    tiny: 'h-6 w-6 text-xs',
    small: 'h-8 w-8 text-sm',
    medium: 'h-10 w-10 text-base',
    large: 'h-12 w-12 text-lg',
    xlarge: 'h-16 w-16 text-xl',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-lg',
  };

  const statusColors = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    busy: 'bg-red-400',
    away: 'bg-yellow-400',
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate background color based on name
  const getBackgroundColor = (name) => {
    if (!name) return 'bg-gray-200';
    const colors = [
      'bg-red-200',
      'bg-yellow-200',
      'bg-green-200',
      'bg-blue-200',
      'bg-indigo-200',
      'bg-purple-200',
      'bg-pink-200',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="relative inline-block">
      {!imageError && src ? (
        <img
          src={src}
          alt={alt || name}
          onError={handleImageError}
          className={`
            ${sizeClasses[size]}
            ${shapeClasses[shape]}
            object-cover
            ${className}
          `}
          {...props}
        />
      ) : (
        <div
          className={`
            ${sizeClasses[size]}
            ${shapeClasses[shape]}
            ${getBackgroundColor(name)}
            flex items-center justify-center text-gray-600 font-medium
            ${className}
          `}
          {...props}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white
            ${statusColors[status]}
          `}
        />
      )}
    </div>
  );
};

// Predefined avatar group component
Avatar.Group = ({
  avatars = [],
  max = 3,
  size = 'medium',
  spacing = -2,
  className = '',
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div
      className={`flex items-center ${className}`}
      style={{ marginLeft: `${Math.abs(spacing)}px` }}
    >
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          style={{ marginLeft: `${spacing}px` }}
          className="relative"
        >
          <Avatar
            size={size}
            {...avatar}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          style={{ marginLeft: `${spacing}px` }}
          className={`
            relative flex items-center justify-center
            ${sizeClasses[size]}
            rounded-full bg-gray-100 text-gray-600 font-medium
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default Avatar; 