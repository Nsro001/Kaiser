import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxdycrmqrrfibbzhpxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZHljcm1xcnJmaWJiYmh6cHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzI4NTUsImV4cCI6MjA4MDI0ODg1NX0.FhzkpN-lBUdrUaLyqDYlDBBkDT6RpS-r6gxgaUpZ1UQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
