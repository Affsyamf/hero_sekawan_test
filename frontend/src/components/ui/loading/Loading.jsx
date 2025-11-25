import React from "react";

/**
 * Generic loading indicator
 * @param {boolean} [fullscreen=false] - Whether to overlay full screen
 * @param {string} [label] - Optional loading text
 * @param {string} [size="md"] - One of "sm" | "md" | "lg"
 */
export default function Loading({ fullscreen = false, label, size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-[6px]",
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]}w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent animate-spin`}
    ></div>
  );

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      {spinner}
      {label && <p className="text-sm text-secondary-text">{label}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-1000 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-10">{content}</div>
  );
}
