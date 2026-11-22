import {mkdir,copyFile,readdir} from 'node:fs/promises';
const target='public/receipt-reader';
await mkdir(target+'/core',{recursive:true});
await copyFile('node_modules/tesseract.js/dist/worker.min.js',target+'/worker.min.js');
for(const name of await readdir('node_modules/tesseract.js-core')){
 if(name.endsWith('.wasm')||name.endsWith('.wasm.js'))await copyFile('node_modules/tesseract.js-core/'+name,target+'/core/'+name);
}
await copyFile('node_modules/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz',target+'/eng.traineddata.gz');
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs',target+'/pdf.worker.min.mjs');
