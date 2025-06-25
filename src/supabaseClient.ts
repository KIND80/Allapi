import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gkbcjhypgsvpipjeginw.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrYmNqaHlwZ3N2cGlwamVnaW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NzMwMDMsImV4cCI6MjA2NjA0OTAwM30.NCRHxpeY_7Q1pTvO0zO3YFkkhj_w61fumXtUBAMRMPA"; // tronqué ici mais remets ta clé complète

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
