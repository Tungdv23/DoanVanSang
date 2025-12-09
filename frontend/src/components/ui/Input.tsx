
import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-500 shadow-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                 read-only:bg-slate-100 read-only:text-slate-700 read-only:cursor-not-allowed
                 transition-shadow duration-200 ${props.className || ""}`}
    />
  );
}
