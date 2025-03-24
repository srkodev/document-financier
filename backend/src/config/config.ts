import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement du fichier .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL || 'https://ibmuvwlbsibmvfptiacr.supabase.co',
  supabaseKey: process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlibXV2d2xic2libXZmcHRpYWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMjE3MzYsImV4cCI6MjA1NjY5NzczNn0.UHE40TILy0zzGeUpELx70rdyPAXxxpNlBRvVvJG5oyo',
  jwtSecret: process.env.JWT_SECRET || 'votre_jwt_secret_par_defaut',
  environment: process.env.NODE_ENV || 'development',
}; 