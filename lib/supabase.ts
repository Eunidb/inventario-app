import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Este cliente es para el FRONTEND (Lado del navegador)
// Al usar createBrowserClient, se encarga de gestionar las cookies por ti
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)