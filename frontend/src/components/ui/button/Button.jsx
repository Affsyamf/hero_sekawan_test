import { useTheme } from "../../../contexts/ThemeContext";

export default function Button({
  icon: Icon, // ex: Plus
  label,
  onClick,
  variant = "primary", // "primary" | "secondary" | "success"
  showDropdown = false,
  className = "",
  ...props
}) {
  const { colors } = useTheme();

  const variants = {
    primary: {
      background: colors.primary,
      hover: colors.primaryHover,
      color: colors.text?.inverse || "#fff",
    },
    secondary: {
      background: colors.secondary,
      hover: colors.secondaryHover,
      color: colors.text?.inverse || "#fff",
    },
    success: {
      background: colors.status.success,
      hover: colors.status.successHover,
      color: colors.text?.inverse || "#fff",
    },
    neutral: {
      background: colors.neutral.base,
      hover: colors.neutral.hover,
      color: colors.text?.default || "#000",
    },
  };

  const isDisabled = props.disabled;

  const disabledStyles = {
    background: colors.neutral.disabled || "#e5e7eb",
    color: colors.text?.muted || "#9ca3af",
    cursor: "not-allowed",
    opacity: 0.7,
  };

  const { background, hover, color } = variants[variant] || variants.primary;

  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:cursor-pointer ${className}`}
      style={isDisabled ? disabledStyles : { background, color }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = background)}
      {...props}
    >
      {/* Icon */}
      {Icon && <Icon size={14} className="mr-1.5" />}

      {/* Label */}
      <span>{label}</span>

      {/* Optional dropdown arrow */}
      {showDropdown && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 ml-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
    </button>
  );
}
