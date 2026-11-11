import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * DataX Global Unified Error Banner
 * Matches the official DataX 00.3 Design System:
 * - Background: #FDEDEB
 * - Border: #F5C7C2
 * - Icon: #C2362F (AlertTriangle, 1.5 stroke)
 * - Text: #474E61
 * - Corner Radius: 14px
 */
export default function DataXErrorBanner({
  message,
  title = null,
  onDismiss = null,
  className = "",
  action = null
}) {
  if (!message) return null;

  return (
    <div 
      role="alert"
      className={`p-3.5 rounded-[14px] bg-[#FDEDEB] border border-[#F5C7C2] flex items-start gap-2.5 transition-all text-left shadow-sm ${className}`}
    >
      <AlertTriangle 
        className="w-4 h-4 text-[#C2362F] shrink-0 mt-0.5" 
        strokeWidth={1.5} 
      />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-xs font-semibold text-[#0A0F1F] mb-0.5">
            {title}
          </h4>
        )}
        <p className="text-xs sm:text-[13px] text-[#474E61] leading-relaxed break-words">
          {message}
        </p>
        {action && (
          <div className="mt-2.5 pt-2 border-t border-[#F5C7C2]/60">
            {action}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[#5F6678] hover:text-[#0A0F1F] p-0.5 rounded transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss error notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

