import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';

/**
 * ActionableErrorBanner
 * Formats API failures into human-actionable guidance instead of raw stack traces.
 */
export default function ActionableErrorBanner({
  error,
  onRetry = null,
  onDismiss = null,
  fallbackAction = null,
  fallbackLabel = "Inspect Settings"
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!error) return null;

  // Extract message and format human-friendly guidance
  const rawMsg = typeof error === 'string' 
    ? error 
    : (error.message || error.detail || JSON.stringify(error));

  let friendlyTitle = "Operation Failed";
  let friendlyExplanation = "An error occurred while communicating with the DataX Decision Fabric.";
  let suggestedAction = "Please check your network connection and verify backend service availability.";

  if (rawMsg.includes("Connection refused") || rawMsg.includes("502") || rawMsg.includes("Failed to fetch")) {
    friendlyTitle = "Service Connection Unavailable";
    friendlyExplanation = "Unable to reach the DataX API endpoint at dataglow.ai.";
    suggestedAction = "Verify that the backend service is running and ports 8003/443 are reachable.";
  } else if (rawMsg.includes("403") || rawMsg.includes("Access Denied")) {
    friendlyTitle = "Permission Required";
    friendlyExplanation = "Your current account role lacks permissions for this operation.";
    suggestedAction = "Switch to an Admin or Data Steward account in the top-right profile menu.";
  } else if (rawMsg.includes("429") || rawMsg.includes("Rate limit")) {
    friendlyTitle = "Rate Limit Reached";
    friendlyExplanation = "Too many requests dispatched within a short time window (60 req/min limit).";
    suggestedAction = "Please wait a few seconds before retrying this operation.";
  } else if (rawMsg.includes("Security Violation") || rawMsg.includes("disallowed DDL")) {
    friendlyTitle = "Security Rule Rejected";
    friendlyExplanation = "The expression contains disallowed DDL syntax (e.g. DROP, TRUNCATE).";
    suggestedAction = "Modify the rule condition to use standard evaluation comparisons (e.g. QUANTITY > 0).";
  } else if (rawMsg.includes("credentials missing") || rawMsg.includes("endpoint is required")) {
    friendlyTitle = "Database Configuration Missing";
    friendlyExplanation = "The selected database node does not have active credentials configured.";
    suggestedAction = "Configure your connection URI or select an active SAP catalog in Connections.";
  }

  return (
    <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 my-4 text-left shadow-lg shadow-red-950/20 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-red-200 mb-0.5">
              {friendlyTitle}
            </h4>
            <p className="text-xs text-slate-300 mb-1.5 leading-relaxed">
              {friendlyExplanation}
            </p>
            <p className="text-[11px] text-red-300/80 font-medium flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
              <strong>Recommended Action:</strong> {suggestedAction}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-red-500/20 text-xs">
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Operation
            </button>
          )}
          {fallbackAction && (
            <button
              onClick={fallbackAction}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {fallbackLabel}
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
        >
          {showTechnicalDetails ? "Hide technical error" : "View technical error"}
          {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible Technical Stack / Detail */}
      {showTechnicalDetails && (
        <div className="mt-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-lg font-mono text-[11px] text-red-300/90 overflow-x-auto whitespace-pre-wrap">
          {rawMsg}
        </div>
      )}
    </div>
  );
}
