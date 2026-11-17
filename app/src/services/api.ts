const API = String(process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\\/+$/, '');

export async function transcribeAudio(uri: string, context: string) {
  if (!API) throw new Error('API não configurada. Defina EXPO_PUBLIC_API_URL com a URL pública do serviço no Render.');

  const data = new FormData();
  data.append('audio', { uri, name: 'fala.m4a', type: 'audio/mp4' } as any);
  data.append('context', context.slice(-3000));

  const response = await fetch(`${API}/transcribe`, {
    method: 'POST',
    body: data
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || `Falha no serviço de transcrição (${response.status}).`);
  }

  if (typeof payload.text !== 'string' || typeof payload.rawText !== 'string') {
    throw new Error('O serviço retornou uma resposta de transcrição inválida.');
  }

  return payload as { rawText: string; text: string; adjusted: boolean };
}
