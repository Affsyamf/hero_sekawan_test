import React, { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { cn } from "../../../utils/cn";

export default function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  actions,
  size = "sm", // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullScreen'
  fullScreen = false,
  showCloseButton = true,
  showFullscreenToggle = false,
  loading = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = "",
}) {
  const { colors } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(fullScreen);
  const modalRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeMap = {
    xs: "max-w-xs",
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    fullScreen: "w-screen h-screen max-w-none",
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const overlayClasses = cn(
    "fixed inset-0 z-100 flex items-center justify-center p-4 duration-200 animate-in fade-in",
    "backdrop-blur-sm"
  );

  const modalClasses = cn(
    "relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out w-full",
    "animate-in zoom-in-95 slide-in-from-bottom-2",
    isFullscreen
      ? "w-screen h-screen max-w-none rounded-none flex flex-col"
      : `${sizeMap[size]} max-h-[calc(100vh-2rem)] flex flex-col`,
    className
  );

  const headerClasses = cn(
    "relative flex items-start justify-between p-6 flex-shrink-0"
  );

  const buttonBaseClasses = cn(
    "p-2 transition-all duration-200 ease-in-out rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1"
  );

  return (
    <div
      className={overlayClasses}
      style={{ backgroundColor: `${colors.overlay || "rgba(0, 0, 0, 0.6)"}` }}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={modalClasses}
        style={{
          backgroundColor: colors.background.primary,
          borderColor: isFullscreen ? "transparent" : colors.border.primary,
          borderWidth: isFullscreen ? 0 : "1px",
        }}
      >
        {/* Header */}
        {(title || subtitle || showCloseButton || showFullscreenToggle) && (
          <div
            className={headerClasses}
            style={{
              borderBottomColor: colors.border.light,
              borderBottomWidth: "1px",
            }}
          >
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                <h2
                  className="text-xl font-semibold leading-tight"
                  style={{ color: colors.text.primary }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: colors.text.secondary }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              {showFullscreenToggle && (
                <button
                  onClick={handleToggleFullscreen}
                  className={buttonBaseClasses}
                  style={{
                    color: colors.text.secondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      colors.background.secondary;
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.text.secondary;
                  }}
                  aria-label={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={buttonBaseClasses}
                  style={{
                    color: colors.text.secondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.status.error}15`;
                    e.currentTarget.style.color = colors.status.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.text.secondary;
                  }}
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "overflow-y-auto flex-1 min-h-0",
            "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <Loader2
                className="w-8 h-8 mb-4 animate-spin"
                style={{ color: colors.primary }}
              />
              <span
                className="text-sm"
                style={{ color: colors.text.secondary }}
              >
                Loading...
              </span>
            </div>
          ) : (
            <div className="p-6">{children}</div>
          )}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div
            className="flex flex-wrap items-center justify-end flex-shrink-0 gap-3 p-6"
            style={{
              borderTopColor: colors.border.light,
              borderTopWidth: "1px",
              backgroundColor: `${colors.background.secondary}80`,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
