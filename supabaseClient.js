import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://obnupijgfeqjvfpyuioc.supabase.co'
const supabaseKey = 'sb_publishable_Esh7iAn0VpUpOXGnnyotgg_KuMTApY7'

export const supabase = createClient(supabaseUrl, supabaseKey)