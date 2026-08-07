import { createServerFn } from '@tanstack/react-start';

export const olistStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const token = process.env['OLIST_API_TOKEN'];
  if (!token) return { configured: false, ok: false, detail: 'Token da Olist ainda não foi salvo.' };
  const { detectFlavor } = await import('./olist.server');
  const { flavor, detail } = await detectFlavor(token);
  return { configured: true, ok: !!flavor, flavor, detail };
});

export const olistSync = createServerFn({ method: 'POST' }).handler(async () => {
  const token = process.env['OLIST_API_TOKEN'];
  if (!token) throw new Error('Token da Olist ainda não foi salvo nas configurações seguras.');
  const { buildSnapshot } = await import('./olist.server');
  return await buildSnapshot(token);
});