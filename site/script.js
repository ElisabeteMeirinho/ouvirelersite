const messages = [
  ['Carlos','A gente pode sair umas três da tarde.'],
  ['Marina','Pra mim está ótimo, eu só preciso pegar uma coisa antes.'],
  ['Joana','Então combinamos assim. Depois eu mando o endereço no grupo.']
];
const miniChat=document.querySelector('#miniChat');
messages.forEach(([name,text],i)=>setTimeout(()=>{const el=document.createElement('div');el.className='mini-message';el.innerHTML=`<b>${name}</b><p>${text}</p>`;miniChat.appendChild(el)},250+i*450));
const modeText=document.querySelector('#modeText'), statusTitle=document.querySelector('#statusTitle'),statusSub=document.querySelector('#statusSub');
document.querySelectorAll('.mode').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
 const speaker=btn.dataset.mode==='speaker';
 modeText.textContent=speaker?'Seu celular usa o microfone para transformar a sua fala em texto. Como você entrou com seu nome, todas as mensagens enviadas por este aparelho já chegam identificadas para a sala.':'Você acompanha todas as falas em um chat grande e legível. Pode aumentar a fonte, destacar a última fala e fixar a tela ativa.';
 statusTitle.textContent=speaker?'Microfone pronto':'Acompanhando conversa';statusSub.textContent=speaker?'Toque para começar a falar':'As falas aparecem automaticamente';
}));
document.querySelector('#talkButton').addEventListener('click',()=>document.querySelector('.mode:not(.active)').click());
