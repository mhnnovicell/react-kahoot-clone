import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://emlynmhrnmephemzdehn.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbHlubWhybm1lcGhlbXpkZWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY2MjIyODIsImV4cCI6MjAyMjE5ODI4Mn0.8xCLIDhvutgdpB4l1rGKV00Sf3MoPGMKKCsqblZAYk4';

export const supabase = createClient(supabaseUrl, supabaseKey);
