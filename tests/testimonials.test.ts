import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {testimonialSchema} from '../src/lib/testimonials';
import {normalizeStoryPhoto} from '../src/lib/server/testimonial-photos';
test('Publication requires explicit consent and photo permissions',()=>{
 const good={displayName:'Customer',email:'customer@example.test',productId:'castor',title:'My routine',story:'I have been using this oil in my weekly routine.',duration:'Six weeks',consent:true,photoRights:true,photos:[]};
 assert.equal(testimonialSchema.safeParse(good).success,true);
 for(const changes of [{consent:false},{photoRights:false},{email:'invalid'},{photos:Array(4).fill({label:'Before',caption:''})}])assert.equal(testimonialSchema.safeParse({...good,...changes}).success,false);
});
test('Photos are decoded, bounded and stripped of metadata before storage',async()=>{
 const input=await sharp({create:{width:1800,height:1000,channels:3,background:'#aabbcc'}}).jpeg().withMetadata().toBuffer();
 const result=await sharp(await normalizeStoryPhoto(input)).metadata();assert.equal(result.width,1600);assert.equal(result.format,'jpeg');assert.equal(result.exif,undefined);assert.equal(result.icc,undefined);
 await assert.rejects(normalizeStoryPhoto(Buffer.from('not an image')));
 await assert.rejects(normalizeStoryPhoto(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>')));
});
