import React from 'react';
import { ArrowLeft } from 'lucide-react';

/**
 * SignOutButton - Outlined Alert Action (00.6)
 */
export default function SignOutButton({ onSignOut }) {
  return (
    <div className="px-3.5 py-2.5">
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#F5C7C2] bg-white dark:bg-transparent hover:bg-[#FDEDEB] dark:hover:bg-red-950/20 text-[#C2362F] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="w-3 h-3 text-[#C2362F]" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
