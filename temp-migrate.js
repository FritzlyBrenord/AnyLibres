const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

async function migrate() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase environment variables');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/seed_fixed_roles.sql'), 'utf8');

    console.log('Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // exec_sql might not exist, trying fallback if it fails
        console.error('Error with exec_sql:', error);
        console.log('Trying direct execute...');

        // If rpc exec_sql is not available, we have to use the Postgres REST API or another method.
        // But usually, in this setup, we have a helper or we use the CLI.
        // Assuming the user has the 'exec_sql' function for migrations as per common patterns here.
        process.exit(1);
    }

    console.log('Migration completed successfully');
}

migrate();
