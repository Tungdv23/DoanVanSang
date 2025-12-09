import type { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
  title,
  titleClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  titleClassName?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-lg p-4 max-h-[90vh] overflow-y-auto"
        style={{ color: "#0f172a" }}
      >
        {title && (
          <h3 className={`text-lg font-semibold mb-2 ${titleClassName ?? "text-current"}`}>
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );
}
