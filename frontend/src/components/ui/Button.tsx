import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base = "px-4 py-2 rounded-md font-medium shadow-sm focus:outline-none";
  const style =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : variant === "outline"
      ? "border border-gray-300 text-gray-700 bg-white"
      : "bg-transparent text-gray-700";
  return (
    <button className={`${base} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}
