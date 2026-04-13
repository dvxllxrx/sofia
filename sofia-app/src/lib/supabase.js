import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://obnupijgfeqjvfpyuioc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibnVwaWpnZmVxanZmcHl1aW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODcyNDAsImV4cCI6MjA5MTY2MzI0MH0.wuXWC4zR_I9tFrTc6MFeeN1cakdu-8IAOElHKwDLv78";

export const supabase = createClient(supabaseUrl, supabaseKey);
