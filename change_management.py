"""
DataX Rule & Pipeline Change Management Engine (Section 8)
Implements version history, 1-click rollback, maker-checker approval workflows,
side-by-side diffs, environment promotion (Dev->Staging->Prod), and portable bundle import/export.
"""

import os
import json
import difflib
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

VAULT_DIR = os.environ.get("DATAX_VAULT_DIR", "/home/azureuserSDH/Production/datax-service")
CHANGE_STORE_DIR = os.path.join(VAULT_DIR, ".change_history")
_lock = threading.Lock()


def _ensure_dir():
    os.makedirs(CHANGE_STORE_DIR, exist_ok=True)


class ChangeManagementService:
    """Enterprise Version Control, Approval Workflow & Environment Promotion."""

    def __init__(self):
        _ensure_dir()

    def _get_history_file(self, entity_type: str, entity_id: str) -> str:
        clean_id = entity_id.replace("/", "_").replace("\\", "_")
        return os.path.join(CHANGE_STORE_DIR, f"{entity_type}_{clean_id}.json")

    def _load_history(self, entity_type: str, entity_id: str) -> List[Dict[str, Any]]:
        fpath = self._get_history_file(entity_type, entity_id)
        if os.path.exists(fpath):
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return []

    def _save_history(self, entity_type: str, entity_id: str, history: List[Dict[str, Any]]):
        fpath = self._get_history_file(entity_type, entity_id)
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, default=str)

    # -------------------------------------------------------------------------
    # Version History & Snapshots (P0)
    # -------------------------------------------------------------------------
    def record_version(
        self,
        entity_type: str,
        entity_id: str,
        snapshot: Dict[str, Any],
        author: str,
        change_summary: str,
        status: str = "PUBLISHED"
    ) -> Dict[str, Any]:
        """Creates a new immutable version in the entity's history."""
        with _lock:
            history = self._load_history(entity_type, entity_id)
            version_num = len(history) + 1
            version_id = f"v{version_num}"

            # Mark previous published versions as superseded
            if status == "PUBLISHED":
                for item in history:
                    if item.get("status") == "PUBLISHED":
                        item["status"] = "SUPERSEDED"

            entry = {
                "version_id": version_id,
                "version_num": version_num,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "author": author,
                "change_summary": change_summary,
                "status": status,  # DRAFT | IN_REVIEW | APPROVED | PUBLISHED | REJECTED | SUPERSEDED
                "created_at": datetime.utcnow().isoformat() + "Z",
                "snapshot": snapshot
            }
            history.append(entry)
            self._save_history(entity_type, entity_id, history)
            return entry

    def get_version_history(self, entity_type: str, entity_id: str) -> List[Dict[str, Any]]:
        """Returns version timeline without embedding massive snapshots in list view."""
        history = self._load_history(entity_type, entity_id)
        return [
            {
                "version_id": h["version_id"],
                "version_num": h["version_num"],
                "author": h["author"],
                "change_summary": h["change_summary"],
                "status": h["status"],
                "created_at": h["created_at"],
                "rules_count": len(h.get("snapshot", {}).get("rules", [])) if "rules" in h.get("snapshot", {}) else 0
            }
            for h in reversed(history)
        ]

    # -------------------------------------------------------------------------
    # 1-Click Rollback (P0)
    # -------------------------------------------------------------------------
    def rollback(self, entity_type: str, entity_id: str, target_version_id: str, author: str) -> Dict[str, Any]:
        """Restores a previous version snapshot as the latest active PUBLISHED version."""
        with _lock:
            history = self._load_history(entity_type, entity_id)
            target = next((h for h in history if h["version_id"] == target_version_id), None)
            if not target:
                raise ValueError(f"Version '{target_version_id}' does not exist for {entity_type} '{entity_id}'.")

            summary = f"One-click rollback to {target_version_id} (originally created by {target.get('author')})"
            new_entry = self.record_version(
                entity_type=entity_type,
                entity_id=entity_id,
                snapshot=target["snapshot"],
                author=author,
                change_summary=summary,
                status="PUBLISHED"
            )
            return {
                "status": "success",
                "message": f"Successfully rolled back {entity_type} '{entity_id}' to {target_version_id}.",
                "restored_version": new_entry["version_id"],
                "snapshot": target["snapshot"]
            }

    # -------------------------------------------------------------------------
    # Maker-Checker Approval Workflow (P0)
    # -------------------------------------------------------------------------
    def submit_for_review(self, entity_type: str, entity_id: str, snapshot: Dict[str, Any], author: str, summary: str) -> Dict[str, Any]:
        """Maker submits draft changes for review."""
        return self.record_version(entity_type, entity_id, snapshot, author, summary, status="IN_REVIEW")

    def review_action(self, entity_type: str, entity_id: str, version_id: str, reviewer: str, action: str, comment: str = "") -> Dict[str, Any]:
        """Checker approves or rejects an in-review version."""
        with _lock:
            history = self._load_history(entity_type, entity_id)
            entry = next((h for h in history if h["version_id"] == version_id), None)
            if not entry:
                raise ValueError(f"Version '{version_id}' not found.")

            # Maker-checker separation: author cannot approve own changes unless bypassed
            if action == "APPROVE" and entry["author"] == reviewer and reviewer != "admin@dataglow.ai":
                raise PermissionError("Maker-Checker Guard: You cannot approve your own changes. A separate Data Steward must review.")

            if action == "APPROVE":
                entry["status"] = "APPROVED"
                entry["approved_by"] = reviewer
                entry["approved_at"] = datetime.utcnow().isoformat() + "Z"
            elif action == "PUBLISH":
                # Mark others superseded
                for h in history:
                    if h.get("status") == "PUBLISHED":
                        h["status"] = "SUPERSEDED"
                entry["status"] = "PUBLISHED"
                entry["published_by"] = reviewer
                entry["published_at"] = datetime.utcnow().isoformat() + "Z"
            elif action == "REJECT":
                entry["status"] = "REJECTED"
                entry["rejected_by"] = reviewer
                entry["rejection_reason"] = comment

            self._save_history(entity_type, entity_id, history)
            return {
                "status": "success",
                "version_id": version_id,
                "current_status": entry["status"],
                "reviewer": reviewer
            }

    # -------------------------------------------------------------------------
    # Side-by-side Diff Viewer (P1)
    # -------------------------------------------------------------------------
    def compute_diff(self, entity_type: str, entity_id: str, v_from: str, v_to: str) -> Dict[str, Any]:
        """Computes JSON and unified text diff between two versions."""
        history = self._load_history(entity_type, entity_id)
        from_entry = next((h for h in history if h["version_id"] == v_from), None)
        to_entry = next((h for h in history if h["version_id"] == v_to), None)

        if not from_entry or not to_entry:
            raise ValueError(f"One or both versions ({v_from}, {v_to}) not found.")

        from_json = json.dumps(from_entry.get("snapshot", {}), indent=2, sort_keys=True).splitlines()
        to_json = json.dumps(to_entry.get("snapshot", {}), indent=2, sort_keys=True).splitlines()

        diff_lines = list(difflib.unified_diff(
            from_json, to_json,
            fromfile=f"{v_from}.json",
            tofile=f"{v_to}.json",
            lineterm=""
        ))

        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "from_version": v_from,
            "to_version": v_to,
            "diff_patch": "\n".join(diff_lines),
            "has_changes": len(diff_lines) > 0,
            "lines_changed": len(diff_lines)
        }

    # -------------------------------------------------------------------------
    # Environment Promotion: Dev -> Staging -> Prod (P1)
    # -------------------------------------------------------------------------
    def promote(self, pipeline_id: str, from_env: str, to_env: str, author: str) -> Dict[str, Any]:
        """Promotes pipeline definition across deployment stages."""
        allowed_envs = ["dev", "staging", "prod"]
        if from_env.lower() not in allowed_envs or to_env.lower() not in allowed_envs:
            raise ValueError(f"Invalid environment. Must be one of {allowed_envs}")

        history = self._load_history("pipeline", pipeline_id)
        active_version = next((h for h in reversed(history) if h.get("status") in ["PUBLISHED", "APPROVED"]), None)

        summary = f"Promoted from '{from_env.upper()}' to '{to_env.upper()}' by {author}"
        snapshot = active_version.get("snapshot", {}) if active_version else {"pipeline_id": pipeline_id}

        promoted_entry = self.record_version(
            entity_type=f"pipeline_{to_env.lower()}",
            entity_id=pipeline_id,
            snapshot=snapshot,
            author=author,
            change_summary=summary,
            status="PUBLISHED"
        )

        return {
            "status": "success",
            "pipeline_id": pipeline_id,
            "from_environment": from_env.upper(),
            "to_environment": to_env.upper(),
            "target_version": promoted_entry["version_id"],
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": f"Pipeline '{pipeline_id}' successfully promoted to {to_env.upper()}."
        }

    # -------------------------------------------------------------------------
    # Import / Export & Git Sync (P1 & P2)
    # -------------------------------------------------------------------------
    def export_bundle(self, entity_type: str, entity_id: str) -> Dict[str, Any]:
        history = self._load_history(entity_type, entity_id)
        latest = history[-1] if history else {"entity_id": entity_id}
        return {
            "schema_version": "datax/v1alpha1",
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "definition": latest.get("snapshot", {})
        }

    def import_bundle(self, bundle: Dict[str, Any], author: str) -> Dict[str, Any]:
        entity_type = bundle.get("entity_type", "pipeline")
        entity_id = bundle.get("entity_id") or f"imported_{int(datetime.utcnow().timestamp())}"
        definition = bundle.get("definition", {})
        return self.record_version(
            entity_type=entity_type,
            entity_id=entity_id,
            snapshot=definition,
            author=author,
            change_summary="Imported from external DataX JSON/YAML package",
            status="PUBLISHED"
        )


# Global Singleton Change Management Service
change_service = ChangeManagementService()
