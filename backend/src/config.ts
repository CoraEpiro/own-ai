import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Supabase configuration
// Extract Supabase URL from connection string
// Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
const connectionString = process.env.CONNECTION_STRING || '';
const urlMatch = connectionString.match(/@db\.([^.]+)\.supabase\.co/);
export const SUPABASE_URL = urlMatch ? `https://${urlMatch[1]}.supabase.co` : '';

export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const logConfigStatus = () => {
  console.log('Loaded config:');
  console.log('OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY);
  console.log('CLAUDE_API_KEY:', !!process.env.CLAUDE_API_KEY);
  console.log('GEMINI_API_KEY:', !!process.env.GEMINI_API_KEY);
  console.log('JWT_SECRET:', !!process.env.JWT_SECRET);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('CONNECTION_STRING:', !!process.env.CONNECTION_STRING);
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
}; 