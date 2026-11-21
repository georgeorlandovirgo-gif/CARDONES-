import {z} from 'zod';
export const MAX_TESTIMONIAL_PHOTOS=3;
export const MAX_PHOTO_BYTES=5*1024*1024;
export const testimonialSchema=z.object({
 displayName:z.string().trim().min(2,'Please enter a display name.').max(60),
 email:z.string().trim().email('Enter an email so we can contact you privately.').max(150),
 productId:z.string().min(2).max(64),
 title:z.string().trim().min(5,'Give your story a short title.').max(100),
 story:z.string().trim().min(30,'Please tell us a little more (at least 30 characters).').max(2500),
 duration:z.string().trim().max(80).default(''),
 consent:z.literal(true),photoRights:z.literal(true),website:z.string().max(0).default(''),
 photos:z.array(z.object({label:z.enum(['Before','After','My experience']),caption:z.string().trim().max(160)})).max(MAX_TESTIMONIAL_PHOTOS)
}).strict();
export type StoryPhoto={url:string;label:string;caption:string};
export type CustomerStory={id:string;display_name:string;product_name:string;product_id:string;title:string;story:string;duration:string;published_at:string|null;photos:StoryPhoto[]};
export type ModeratedStory=CustomerStory & {email:string;status:'pending'|'approved'|'rejected'|'hidden';created_at:string};
