"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-gray-400 mb-2 font-medium">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-lg bg-black/50 border border-void-border text-white placeholder-gray-600 focus:outline-none focus:border-blood/60 focus:shadow-neon-sm focus:scale-[1.01] transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
