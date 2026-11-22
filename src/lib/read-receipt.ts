import {receiptReferences} from './receipt-reference';
import type {Worker} from 'tesseract.js';
export async function readReceipt(file:File,signal:AbortSignal):Promise<string[]>{
 if(file.size>5*1024*1024)throw Error('Please choose a file no larger than 5 MB.');
 const base=(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/receipt-reader';
 let worker:Worker|undefined,pdfTask:import('pdfjs-dist').PDFDocumentLoadingTask|undefined;
 const stop=()=>{void worker?.terminate();void pdfTask?.destroy();};
 signal.addEventListener('abort',stop);
 const check=()=>{if(signal.aborted)throw Error('Reading cancelled. Enter the transaction ID manually.');};
 async function recognize(canvas:HTMLCanvasElement){
  check();
  if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker('eng',1,{workerPath:base+'/worker.min.js',corePath:base+'/core',langPath:base,workerBlobURL:false});if(signal.aborted){await worker.terminate();check();}}
  const result=await worker.recognize(canvas);check();return result.data.text;
 }
 try{
  check();let text='';
  if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
   const pdfjs=await import('pdfjs-dist');check();pdfjs.GlobalWorkerOptions.workerSrc=base+'/pdf.worker.min.mjs';
   pdfTask=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),maxImageSize:16_000_000,stopAtErrors:true});
   const pdf=await pdfTask.promise;check();
   // Render visible receipt content, rather than trusting a hidden PDF text layer.
   for(let i=1;i<=Math.min(pdf.numPages,2);i++){
    check();const page=await pdf.getPage(i),native=page.getViewport({scale:1});
    const scale=Math.min(2,2200/Math.max(native.width,native.height));
    const viewport=page.getViewport({scale}),canvas=document.createElement('canvas');
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    try{await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;text+='\n'+await recognize(canvas);}finally{canvas.width=canvas.height=1;page.cleanup();}
   }
  }else{
   const bitmap=await createImageBitmap(file);check();
   try{
    if(bitmap.width*bitmap.height>16_000_000)throw Error('Image is too large to read automatically. Enter the transaction ID manually.');
    const scale=Math.min(1,3000/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    try{canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);text=await recognize(canvas);}finally{canvas.width=canvas.height=1;}
   }finally{bitmap.close();}
  }
  check();return receiptReferences(text);
 }finally{signal.removeEventListener('abort',stop);await worker?.terminate();await pdfTask?.destroy();}
}
