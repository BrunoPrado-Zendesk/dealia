import { ipcMain, dialog, shell, Notification } from 'electron';
import Anthropic from '@anthropic-ai/sdk';
import {
  getAllAccounts,
  insertAccount,
  updateAccount,
  deleteAccount,
  setContactStatus,
  getSettings,
  saveSettings,
  getNotificationLog,
  getForecastOpps,
  getClosedWonOpps,
  updateForecastAisField,
  getAnalyticsData,
  getQuotas,
  upsertQuota,
  deleteQuota,
  setForecastTopDeal,
} from './database';
import type { AisForecast, ContactStatus } from '../shared/types';
import { sendTestNotification } from './slack';
import { runRenewalCheck } from './scheduler';
import { importCsvFile } from './csv-import';
import { importForecastCsv, importClosedWonCsv } from './forecast-import';
import type { AccountFormData, AppSettings } from '../shared/types';

export function registerIpcHandlers(): void {
  ipcMain.handle('accounts:getAll', () => getAllAccounts());

  ipcMain.handle('accounts:add', (_event, data: AccountFormData) => {
    const id = insertAccount(data);
    return { id };
  });

  ipcMain.handle('accounts:update', (_event, id: number, data: AccountFormData) => {
    updateAccount(id, data);
    return { ok: true };
  });

  ipcMain.handle('accounts:setStatus', (_event, id: number, status: ContactStatus) => {
    setContactStatus(id, status);
    return { ok: true };
  });

  ipcMain.handle('accounts:delete', (_event, id: number) => {
    deleteAccount(id);
    return { ok: true };
  });

  ipcMain.handle('settings:get', () => getSettings());

  ipcMain.handle('settings:save', (_event, settings: Partial<AppSettings>) => {
    saveSettings(settings);
    return { ok: true };
  });

  ipcMain.handle('slack:test', () => sendTestNotification());

  ipcMain.handle('notify:test', () => {
    new Notification({
      title: 'Deal Tracker — Test Notification',
      body: 'macOS notifications are working correctly.',
    }).show();
    return { ok: true };
  });

  ipcMain.handle('scheduler:runNow', async () => {
    const count = await runRenewalCheck();
    return { sent: count };
  });

  ipcMain.handle('notifications:getLog', () => getNotificationLog());

  ipcMain.handle('csv:import', (_event, filePath: string) => importCsvFile(filePath));

  ipcMain.handle('shell:openExternal', (_event, url: string) => shell.openExternal(url));

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Forecast
  ipcMain.handle('forecast:getOpps', () => getForecastOpps());
  ipcMain.handle('forecast:getClosedWon', () => getClosedWonOpps());
  ipcMain.handle('forecast:importPipeline', (_event, filePath: string) => importForecastCsv(filePath));
  ipcMain.handle('forecast:importClosedWon', (_event, filePath: string) => importClosedWonCsv(filePath));
  ipcMain.handle('analytics:getData', () => getAnalyticsData());

  // Quotas
  ipcMain.handle('quotas:getAll', () => getQuotas());
  ipcMain.handle('quotas:upsert', (_event, ai_ae: string, data: { region?: string; quota: number; q1_target?: number; q2_target?: number; q3_target?: number; q4_target?: number }) => { upsertQuota(ai_ae, data); return { ok: true }; });
  ipcMain.handle('quotas:delete', (_event, ai_ae: string) => { deleteQuota(ai_ae); return { ok: true }; });

  // Dealia AI chat
  ipcMain.handle('dealia:chat', async (_event, messages: { role: 'user' | 'assistant'; content: string }[], context: string) => {
    const settings = getSettings();
    if (!settings.anthropic_api_key) {
      return { ok: false, error: 'No Anthropic API key configured. Add it in Settings → AI Assistant.' };
    }
    try {
      const client = new Anthropic({ apiKey: settings.anthropic_api_key });
      const systemPrompt = `You are Dealia, an AI sales analytics assistant for an enterprise SaaS company's AI Solutions team. You help the CRO and sales leadership understand their pipeline, forecast accuracy, and team performance.

You have access to real-time pipeline data provided below. Be concise, insightful, and direct. Cite specific numbers from the data. Use a confident, executive-level tone. When you identify risks or opportunities, be specific about which deals or reps are involved.

Focus areas: pipeline health, forecast accuracy, quota attainment, risk identification, team performance, actionable next steps.

Today's date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

${context}`;
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });
      const reply = response.content[0].type === 'text' ? response.content[0].text : '';
      return { ok: true, reply };
    } catch (err: any) {
      return { ok: false, error: err.message ?? 'API call failed' };
    }
  });

  ipcMain.handle('forecast:setTopDeal', (_event, id: number, value: number) => {
    setForecastTopDeal(id, value);
    return { ok: true };
  });

  ipcMain.handle(
    'forecast:updateAisField',
    (_event, id: number, field: 'ais_forecast' | 'ais_arr' | 'ais_close_date', value: AisForecast | number | string | null) => {
      updateForecastAisField(id, field, value);
      return { ok: true };
    },
  );
}
