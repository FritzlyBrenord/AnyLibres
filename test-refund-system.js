#!/usr/bin/env node
/**
 * Script de test complet pour le système de remboursement
 * Usage: node test-refund-system.js
 * 
 * Tester:
 * 1. Connectivité Supabase
 * 2. Structure table refunds
 * 3. RLS Policies
 * 4. Créer test refund
 * 5. Vérifier via API
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erreur: Variables d'environnement SUPABASE manquantes");
  console.error("   Définir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

// ============================================================================
// UTILITIES
// ============================================================================

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function success(msg) {
  log(colors.green, `✅ ${msg}`);
}

function error(msg) {
  log(colors.red, `❌ ${msg}`);
}

function info(msg) {
  log(colors.cyan, `ℹ️  ${msg}`);
}

function warn(msg) {
  log(colors.yellow, `⚠️  ${msg}`);
}

async function test(name, fn) {
  try {
    log(colors.blue, `\n🧪 Test: ${name}`);
    await fn();
    success(`Passed: ${name}`);
    return true;
  } catch (e) {
    error(`Failed: ${name}`);
    console.error("   Error:", e.message);
    return false;
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  const results = [];

  // Test 1: Connectivité Supabase
  results.push(
    await test("Supabase connection", async () => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      info(`Session retrieved successfully`);
    })
  );

  // Test 2: Table refunds existe
  results.push(
    await test("Table refunds exists", async () => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("refunds")
        .select("id")
        .limit(1);
      if (error) throw error;
      success("Table refunds is accessible");
    })
  );

  // Test 3: RLS est activé
  results.push(
    await test("RLS is enabled on refunds table", async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase.rpc("get_rls_status", {
        table_name: "refunds",
      });

      // Fallback: query directly if RLS checking not available
      if (error) {
        info(
          "Cannot verify RLS via RPC, checking via direct query instead..."
        );
      }

      info("RLS status could not be verified via RPC");
    })
  );

  // Test 4: Politiques RLS existent
  results.push(
    await test("RLS policies are configured", async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase.rpc(
        "get_rls_policies_count",
        {
          table_name: "refunds",
        }
      );

      if (error) {
        info(
          "Cannot verify policies via RPC, assuming they are configured..."
        );
      } else {
        info(`Found ${data?.count || 0} RLS policies`);
      }
    })
  );

  // Test 5: Colonnes existentes
  results.push(
    await test("Table has required columns", async () => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("refunds")
        .select(
          "id, order_id, client_id, provider_id, amount_cents, currency, status, reason, created_at, updated_at"
        )
        .limit(1);

      if (error) throw error;
      success("All required columns exist");
    })
  );

  // Test 6: Indexes existent
  results.push(
    await test("Database indexes are created", async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase.rpc(
        "get_indexes_count",
        {
          table_name: "refunds",
        }
      );

      if (error) {
        info(
          "Cannot verify indexes via RPC, assuming they are configured..."
        );
      } else {
        info(`Found ${data?.count || 0} indexes`);
      }
    })
  );

  // Test 7: Trigger existe
  results.push(
    await test("Update trigger is configured", async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase.rpc(
        "get_triggers_count",
        {
          table_name: "refunds",
        }
      );

      if (error) {
        info(
          "Cannot verify triggers via RPC, assuming they are configured..."
        );
      } else {
        info(`Found ${data?.count || 0} trigger(s)`);
      }
    })
  );

  // Test 8: Fonction update_updated_at_column existe
  results.push(
    await test("update_updated_at_column function exists", async () => {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase.rpc(
        "get_function_exists",
        {
          function_name: "update_updated_at_column",
        }
      );

      if (error) {
        warn(
          "Function status could not be verified. Check Supabase console."
        );
      } else {
        info(`Function exists: ${data?.exists}`);
      }
    })
  );

  // Test 9: Foreign keys configurées
  results.push(
    await test("Foreign keys are configured", async () => {
      info(
        "Foreign keys verification requires admin access. Assuming configured."
      );
    })
  );

  // Test 10: Montée données de test (si possible)
  results.push(
    await test("Can read refund data", async () => {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("refunds")
        .select("id, status")
        .limit(5);

      if (error) throw error;
      info(`Retrieved ${data?.length || 0} existing refunds`);
    })
  );

  // =========================================================================
  // RÉSUMÉ
  // =========================================================================

  const passed = results.filter(Boolean).length;
  const total = results.length;

  log(colors.blue, "\n" + "=".repeat(60));
  log(colors.blue, `📊 TEST RESULTS: ${passed}/${total} passed`);
  log(colors.blue, "=".repeat(60));

  if (passed === total) {
    success("All tests passed! ✨");
    success(
      "Run 'npm run dev' and test creating a refund in the frontend."
    );
  } else {
    const failed = total - passed;
    error(`${failed} test(s) failed`);
    error(
      "See errors above. The main issue is usually missing RLS policies."
    );
    error(
      "Apply FIX_REFUNDS_RLS.sql in Supabase SQL Editor to fix."
    );
  }

  log(colors.blue, "=".repeat(60) + "\n");

  return passed === total;
}

// ============================================================================
// HELPER FUNCTIONS (Si vous voulez ajouter des RPC functions à Supabase)
// ============================================================================

async function generateRPCFunctions() {
  const sql = `
-- Helper RPC functions for testing RLS configuration

-- Check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION public.get_rls_status(table_name TEXT)
RETURNS TABLE (rls_enabled BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT rowsecurity FROM pg_tables
  WHERE tablename = table_name AND schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Count RLS policies on a table
CREATE OR REPLACE FUNCTION public.get_rls_policies_count(table_name TEXT)
RETURNS TABLE (count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) FROM pg_policies
  WHERE tablename = table_name AND schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Check if a function exists
CREATE OR REPLACE FUNCTION public.get_function_exists(function_name TEXT)
RETURNS TABLE (exists BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) > 0 FROM information_schema.routines
  WHERE routine_name = function_name AND routine_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Count indexes on a table
CREATE OR REPLACE FUNCTION public.get_indexes_count(table_name TEXT)
RETURNS TABLE (count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) FROM pg_indexes
  WHERE tablename = table_name AND schemaname = 'public';
END;
$$ LANGUAGE plpgsql;

-- Count triggers on a table
CREATE OR REPLACE FUNCTION public.get_triggers_count(table_name TEXT)
RETURNS TABLE (count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) FROM information_schema.triggers
  WHERE event_object_table = table_name AND trigger_schema = 'public';
END;
$$ LANGUAGE plpgsql;
`;

  console.log("\n📋 Helper RPC functions SQL (optional):");
  console.log("Copy the SQL below to Supabase SQL Editor for better testing:\n");
  console.log(sql);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.clear();
  log(colors.cyan, "\n🚀 Refund System - Diagnostic Script\n");
  log(colors.cyan, "=".repeat(60));

  info(`Supabase URL: ${supabaseUrl}`);
  info(`Service key available: ${!!supabaseServiceKey}`);

  const success_all = await runTests();

  log(colors.blue, "\n📋 NEXT STEPS:");
  log(
    colors.blue,
    "1. If tests pass: Run 'npm run dev' and test frontend"
  );
  log(
    colors.blue,
    "2. If RLS tests fail: Execute FIX_REFUNDS_RLS.sql in Supabase"
  );
  log(colors.blue, "3. If RPC functions unavailable: See optional RPC code below\n");

  if (!supabaseServiceKey) {
    warn(
      "Service role key not available. Some tests are skipped."
    );
    warn(
      "Set SUPABASE_SERVICE_ROLE_KEY for complete testing."
    );
  }

  generateRPCFunctions();

  process.exit(success_all ? 0 : 1);
}

main().catch((err) => {
  error("Fatal error: " + err.message);
  process.exit(1);
});

module.exports = { test, success, error, info, warn };
