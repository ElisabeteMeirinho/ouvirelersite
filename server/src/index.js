import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'https://elisabetemeirinho.github.io,http://localhost:19006,http://localhost:8081')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origem não autorizada para a API do Ouvir & Ler.'));
  },
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json({ limit: '64kb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 }
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const requestWindows = new Map();
function transcriptionRateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const windowMs = 60 * 1000;
  const maxRequests = 20;
  const current = requestWindows.get(key);

  if (!current || now - current.startedAt >= windowMs) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (current.count >= maxRequests) {
    return res.status(429).json({ error: 'Muitas gravações em pouco tempo. Aguarde um minuto e tente novamente.' });
  }

  current.count += 1;
  if (requestWindows.size > 5000) {
    for (const [ip, value] of requestWindows) {
      if (now - value.startedAt >= windowMs) requestWindows.delete(ip);
    }
  }
  return next();
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ouvir-e-ler',
    transcriptionModel: 'gpt-transcribe',
    openaiConfigured: Boolean(openai)
  });
});

app.post('/transcribe', transcriptionRateLimit, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Áudio não recebido.' });
  if (!openai) return res.status(503).json({ error: 'Configure OPENAI_API_KEY nas variáveis do servidor.' });

  const context = String(req.body?.context || '').slice(-3000);
  const audioName = req.file.originalname || 'fala.webm';

  try {
    const audioFile = await toFile(req.file.buffer, audioName, {
      type: req.file.mimetype || 'audio/webm'
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-transcribe',
      language: 'pt',
      ...(context ? { prompt: `Contexto recente e termos que podem aparecer na fala:\n${context}` } : {})
    });

    const rawText = String(transcription.text || '').trim();
    if (!rawText) return res.json({ rawText: '', text: '', adjusted: false });

    let finalText = rawText;
    let adjusted = false;

    // A revisão contextual é conservadora: quando não houver evidência suficiente,
    // a transcrição original deve ser preservada.
    try {
      const response = await openai.responses.create({
        model: 'gpt-5-mini',
        input: [
          {
            role: 'system',
            content: [
              'Você revisa transcrições para acessibilidade auditiva em português do Brasil.',
              'Use o contexto apenas para corrigir palavras claramente reconhecidas de forma errada.',
              'Considere semelhança sonora e gramatical; não complete frases por suposição.',
              'Não acrescente fatos, nomes, perguntas ou intenções que não estejam sustentados pelo áudio transcrito.',
              'Não resuma nem mude o sentido, o tom ou a intenção.',
              'Se houver dúvida, preserve a transcrição original.',
              'Retorne somente o texto final.'
            ].join(' ')
          },
          {
            role: 'user',
            content: `Contexto recente da conversa:\n${context || '(sem contexto)'}\n\nTranscrição original:\n${rawText}`
          }
        ]
      });

      const candidate = String(response.output_text || '').trim();
      if (candidate) {
        finalText = candidate.slice(0, 1500);
        adjusted = finalText !== rawText;
      }
    } catch (reviewError) {
      console.error('Revisão contextual indisponível; mantendo transcrição original:', reviewError?.message || reviewError);
    }

    return res.json({ rawText, text: finalText, adjusted });
  } catch (error) {
    console.error('Falha na transcrição:', error?.message || error);
    return res.status(500).json({ error: 'Não foi possível transcrever este áudio. Tente gravar um trecho mais curto e falar próximo ao microfone.' });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'O áudio ficou grande demais. Grave um trecho mais curto.' });
  }
  console.error('Erro na API:', error?.message || error);
  return res.status(500).json({ error: 'Erro interno no serviço de transcrição.' });
});

const port = Number(process.env.PORT || 3333);
app.listen(port, '0.0.0.0', () => {
  console.log(`Ouvir & Ler API ativa na porta ${port}`);
});
