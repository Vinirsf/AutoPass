import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://pgjcbjnlcmsjzabehthy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamNiam5sY21zanphYmVodGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Nzc4NjMsImV4cCI6MjA2MTQ1Mzg2M30.g8_Xm_r2dbUZlO4haMwDOgXO-e2JsVGncnWltP1diC4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
