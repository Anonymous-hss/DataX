import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callAiRuleEngine, getDefaultPromptForTable } from '../utils/aiRuleSynthesizer';
import { api } from '../services/apiClient';

describe('aiRuleSynthesizer utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates contextual default prompts based on tableName and columns', () => {
    const prompt1 = getDefaultPromptForTable('MARA', 'sap_bw', ['MATNR', 'BRGEW']);
    expect(prompt1).toContain('MATNR');

    const prompt2 = getDefaultPromptForTable('users_table', 'postgres', ['email', 'full_name']);
    expect(prompt2.toLowerCase()).toContain('email');

    const defaultPrompt = getDefaultPromptForTable('custom_tbl', 'postgres', []);
    expect(defaultPrompt).toContain('custom_tbl');
  });

  it('returns synthesized rules when backend API succeeds', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      success: true,
      rules: [
        {
          id: 'r_1',
          name: 'Mandatory PO',
          field: 'PO_NUMBER',
          severity: 'Critical',
          condition: 'record.PO_NUMBER != null && record.PO_NUMBER !== ""',
          code: 'record.PO_NUMBER != null',
          desc: 'PO number must not be null'
        }
      ],
      engine: 'Azure OpenAI (gpt-5-mini)'
    });

    const rules = await callAiRuleEngine({
      prompt: 'Validate PO numbers',
      columns: ['PO_NUMBER', 'AMOUNT'],
      tableName: '0PUR_C01'
    });

    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('Mandatory PO');
    expect(rules[0].field).toBe('PO_NUMBER');
    expect(rules[0].badge).toBe('Azure OpenAI (gpt-5-mini)');
  });

  it('falls back to local semantic synthesis if backend call fails', async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Network offline'));

    const rules = await callAiRuleEngine({
      prompt: 'Check email format and positive amount',
      columns: ['EMAIL', 'AMOUNT'],
      tableName: 'CUSTOMERS'
    });

    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some(r => r.field === 'EMAIL' || r.field === 'AMOUNT')).toBe(true);
  });
});
