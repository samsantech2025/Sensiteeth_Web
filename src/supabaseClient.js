import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://snvrykahnydcsdvfwfbw.supabase.co";  // Replace with your actual Supabase URL
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudnJ5a2FobnlkY3NkdmZ3ZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4OTc4MDMsImV4cCI6MjA1NTQ3MzgwM30.V1AB97SqUL0x9koX20c6mvmiXExnkP0a3zyy-tQaBY0"; // Replace with your actual Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
