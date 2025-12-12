import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
    import.meta.env.VITE_YOUR_PROJECT_URL ,
    import.meta.env.VITE_YOUR_SUPABASE_PUBLIC_API_KEY
)