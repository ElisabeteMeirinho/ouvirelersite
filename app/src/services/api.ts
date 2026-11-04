const API=process.env.EXPO_PUBLIC_API_URL;
export async function transcribeAudio(uri:string,context:string){
 if(!API) throw new Error('API não configurada');
 const data=new FormData();
 data.append('audio',{uri,name:'fala.m4a',type:'audio/m4a'} as any);data.append('context',context);
 const res=await fetch(`${API}/transcribe`,{method:'POST',body:data});
 if(!res.ok)throw new Error(await res.text());
 return res.json() as Promise<{rawText:string;text:string;adjusted:boolean}>;
}
