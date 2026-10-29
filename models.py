"""
DataX Data Models & Schemas
Contains Pydantic request and response models for all API endpoints.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RuleItem(BaseModel):
    id: Optional[str] = "rule"
    name: Optional[str] = "Validation Rule"
    column: Optional[str] = "GENERAL"
    check_type: Optional[str] = "REGEX_FORMAT"
    condition: Optional[str] = ""
    code: Optional[str] = ""
    severity: Optional[str] = "critical"
    enabled: Optional[bool] = True
    description: Optional[str] = ""


class SourceConfig(BaseModel):
    engine: Optional[str] = "postgres"
    connectionUri: Optional[str] = None
    credentialId: Optional[str] = None
    database: Optional[str] = None
    table: Optional[str] = None
    scopeMode: Optional[str] = "specific"
    columns: Optional[List[str]] = None
    filterCondition: Optional[str] = None
    limit: Optional[int] = 1420
    selectedTables: Optional[List[str]] = None
    selectAllTables: Optional[bool] = False
    fileData: Optional[List[Dict[str, Any]]] = None
    fileName: Optional[str] = None


class TargetConfig(BaseModel):
    engine: Optional[str] = "postgres"
    connectionUri: Optional[str] = None
    credentialId: Optional[str] = None
    database: Optional[str] = None
    table: Optional[str] = "clean_records"
    quarantineTable: Optional[str] = "quarantined_records"
    scopeMode: Optional[str] = "specific"
    writeMode: Optional[str] = "append"
    targetNamingMode: Optional[str] = "suffix"
    customTableName: Optional[str] = None
    selectedTables: Optional[List[str]] = None
    selectAllTables: Optional[bool] = False
    fileData: Optional[List[Dict[str, Any]]] = None
    fileName: Optional[str] = None


class PipelineExecutionRequest(BaseModel):
    pipelineName: Optional[str] = "DataX Autonomous Pipeline"
    threadId: Optional[str] = None
    dryRun: Optional[bool] = False
    autoFixEnabled: Optional[bool] = True
    idempotencyKey: Optional[str] = None
    executionId: Optional[str] = None
    source: SourceConfig
    rules: List[RuleItem]
    target1: TargetConfig
    target2: Optional[TargetConfig] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    uploadedRecords: Optional[List[Dict[str, Any]]] = None


class ThreadCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    domainPackId: Optional[str] = "custom"
    category: Optional[str] = "Custom Pipeline"
    badge: Optional[str] = "Custom"
    status: Optional[str] = "active"
    autoFixEnabled: Optional[bool] = True
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    sourceConfig: Optional[Dict[str, Any]] = None
    targetConfig: Optional[Dict[str, Any]] = None
    rules: Optional[List[Dict[str, Any]]] = None


class QuarantineResolveRequest(BaseModel):
    quarantineId: Optional[Any] = None
    quarantine_id: Optional[Any] = None
    recordId: Optional[Any] = None
    record_id: Optional[Any] = None
    thread_id: Optional[str] = None
    action: Optional[str] = "remediate"  # 'approve' | 'edit_and_commit' | 'discard' | 'remediate' | 'hitl_review' | 'reject'
    editedPayload: Optional[Dict[str, Any]] = None
    resolutionNotes: Optional[str] = None


class StoreCredentialRequest(BaseModel):
    name: Optional[str] = "Database Connection"
    engine: str
    connectionUri: Optional[str] = None
    host: Optional[str] = None
    port: Optional[str] = None
    database: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None


class SampleDataRequest(BaseModel):
    engine: str
    connectionUri: Optional[str] = None
    credentialId: Optional[str] = None
    host: Optional[str] = None
    port: Optional[str] = None
    database: Optional[str] = None
    table: Optional[str] = None
    user: Optional[str] = None
    password: Optional[str] = None
    limit: Optional[int] = 5


class GenerateRulesRequest(BaseModel):
    tableName: Optional[str] = "MARA"
    columns: Optional[List[str]] = []
    selectedColumns: Optional[List[str]] = None
    sampleRows: Optional[List[Dict[str, Any]]] = []
    prompt: Optional[str] = "Line items must have positive quantities."
    engine: Optional[str] = "sap_bw"
    governanceMode: Optional[str] = "balanced"


class DraftPromptRequest(BaseModel):
    tableName: Optional[str] = "source_table"
    engine: Optional[str] = "mongodb"
    columns: Optional[List[str]] = []
    selectedColumns: Optional[List[str]] = None
    sampleRows: Optional[List[Dict[str, Any]]] = []
    governanceMode: Optional[str] = "balanced"



class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "admin"
    role: Optional[str] = None


class RegisterRequest(BaseModel):
    email: str
    password: str
    fullName: Optional[str] = None
    tenantId: Optional[str] = "tenant_enterprise"


class RuleVerifyRequest(BaseModel):
    rules: List[Dict[str, Any]]
    sample_records: Optional[List[Dict[str, Any]]] = None


class RagScanRequest(BaseModel):
    chunks: List[Dict[str, Any]]
    persist: Optional[bool] = True


class AgentToolInterceptRequest(BaseModel):
    agent_id: Optional[str] = "autonomous_agent"
    tool_name: Optional[str] = "unspecified_tool"
    arguments: Optional[Dict[str, Any]] = None
    policies: Optional[Dict[str, Any]] = None


class MlCertifyRequest(BaseModel):
    modality: Optional[str] = "TABULAR"
    candidateRecords: Optional[List[Dict[str, Any]]] = None
    baselineRecords: Optional[List[Dict[str, Any]]] = None
    jsonlRecords: Optional[List[Dict[str, Any]]] = None
    targetColumn: Optional[str] = None
    protectedColumn: Optional[str] = None
    datasetName: Optional[str] = "dataset_candidate"


class UseCaseAdvisorRequest(BaseModel):
    role: Optional[str] = None
    stack: Optional[List[str]] = None
    goal: Optional[str] = None
    schema_columns: Optional[List[str]] = None

