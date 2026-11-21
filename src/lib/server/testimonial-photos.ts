import sharp from 'sharp';
import {MAX_PHOTO_BYTES} from '@/lib/testimonials';
export async function normalizeStoryPhoto(bytes:Buffer):Promise<Buffer>{
 if(!bytes.length||bytes.length>MAX_PHOTO_BYTES)throw Error('Each photo must be 5 MB or smaller.');
 const image=sharp(bytes,{limitInputPixels:25_000_000,failOn:'error'});
 const info=await image.metadata();
 if(!['jpeg','png','webp'].includes(info.format||'')||(info.pages||1)>1)throw Error('Use a still JPG, PNG or WebP photo.');
 // Re-encoding strips EXIF/GPS and embedded metadata. Never publish originals.
 return image.rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).jpeg({quality:84}).toBuffer();
}
