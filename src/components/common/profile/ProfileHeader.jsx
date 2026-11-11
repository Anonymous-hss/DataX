import React from 'react';

/**
 * ProfileHeader - User Identity & Live Status Badge (00.6)
 */
export default function ProfileHeader({ fullName, email, tenantId, initials, imageUrl }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-[#0A0F1F] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
          {imageUrl ? (
            <img src={imageUrl} alt={fullName} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white leading-tight truncate">
            {fullName}
          </h3>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-0.5 truncate">
            AAVIL Inc · {tenantId}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#34D399]/40 text-[#22845E] text-[11px] font-medium shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        <span>Live prod</span>
      </div>
    </div>
  );
}
