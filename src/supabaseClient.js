import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kkfewecwelbsomrqvlfi.supabase.co'
const SUPABASE_KEY = 'sb_publishable_sqBkW6m4S5posI6qsgf9UA_UT1aVJAQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
