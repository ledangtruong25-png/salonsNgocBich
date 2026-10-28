import { redirect } from 'next/navigation';
import { supabaseEnv } from '@/lib/env';
export default function Home() { redirect(supabaseEnv() ? '/login' : '/setup'); }
