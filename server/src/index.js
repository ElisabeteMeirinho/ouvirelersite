import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import OpenAI from 'openai';

const app=express();
const upload=multer({dest:'uploads/',limits:{fileSize:15*1024*1024}});
const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
app.use(cors());app.use(express.json());
app.get('/health',(_,res)=>res.json({ok:true,service:'ouvir-e-ler'}));

app.post('/transcribe',upload.single('audio'),async(req,res)=>{
  if(!req.file)return res.status(400).json({error:'Áudio não recebido'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'Configure OPENAI_API_KEY no servidor'});
  try{
    const transcription=await openai.audio.transcriptions.create({file:fs.createReadStream(req.file.path),model:'gpt-4o-transcribe',language:'pt'});
    const rawText=(transcription.text||'').trim();
    if(!rawText)return res.json({rawText:'',text:'',adjusted:false});
    const context=(req.body.context||'').slice(-4000);
    const response=await openai.responses.create({
      model:'gpt-5-mini',
      input:[
        {role:'system',content:'Você melhora transcrições para acessibilidade auditiva. Corrija pontuação, concordância óbvia e palavras provavelmente transcritas errado usando apenas o contexto fornecido. Preserve o sentido, o tom e a intenção. Não acrescente fatos, não resuma e não censure. Retorne somente a frase final em português do Brasil.'},
        {role:'user',content:`Contexto recente da conversa:\n${context||'(sem contexto)'}\n\nTranscrição atual:\n${rawText}`}
      ]
    });
    const text=(response.output_text||rawText).trim();
    res.json({rawText,text,adjusted:text!==rawText});
  }catch(error){console.error(error);res.status(500).json({error:'Falha ao transcrever ou ajustar a fala'});}finally{fs.unlink(req.file.path,()=>{});}
});
app.listen(process.env.PORT||3333,'0.0.0.0',()=>console.log(`Ouvir & Ler API em http://localhost:${process.env.PORT||3333}`));
