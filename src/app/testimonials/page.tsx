import type {Metadata} from 'next';
import {CustomerStories} from '@/components/CustomerStories';
export const metadata:Metadata={title:'Customer testimonials',description:'Share your Cardone’s experience, your routine and optional before and after photos.'};
export default function TestimonialsPage(){return <CustomerStories/>;}
