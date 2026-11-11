import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * SignOutButton - Outlined Alert Action (00.6)
 */
export default function SignOutButton({ onSignOut }) {
  return (
    <div className="p-4 pt-3.5">
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#F5C7C2] bg-white dark:bg-transparent hover:bg-[#FDEDEB] dark:hover:bg-red-950/20 text-[#C2362F] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#C2362F]" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
