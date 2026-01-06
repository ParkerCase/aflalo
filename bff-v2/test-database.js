// Test script to verify Xata database connection and data
// Run with: node test-database.js

const { Pool } = require("pg");
import dotenv from "dotenv";
dotenv.config();

async function testDatabaseConnection() {
  console.log("🔍 Testing BFF Database Connection...\n");

  if (!process.env.XATA_DATABASE_URL) {
    console.error("❌ XATA_DATABASE_URL environment variable not found");
    console.log("Make sure your .env.local file is properly configured");
    return;
  }

  const pool = new Pool({
    connectionString: process.env.XATA_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Test basic connection
    console.log("1. Testing database connection...");
    const timeResult = await pool.query("SELECT NOW() as current_time");
    console.log(
      `✅ Connected! Server time: ${timeResult.rows[0].current_time}\n`
    );

    // Check which tables exist
    console.log("2. Checking tables...");
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("Tables found:");
    tablesResult.rows.forEach((row) => {
      console.log(`   📁 ${row.table_name}`);
    });
    console.log("");

    // Check strains data
    console.log("3. Checking strains data...");
    const strainCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM strains"
    );
    const strainCount = parseInt(strainCountResult.rows[0].count);
    console.log(`📊 Total strains: ${strainCount}`);

    if (strainCount > 0) {
      // Show sample strains
      const sampleStrains = await pool.query(`
        SELECT name, type, source, 
               (terpenes->>'dominant') as dominant_terpene,
               thc_max, cbd_max
        FROM strains 
        LIMIT 5
      `);

      console.log("Sample strains:");
      sampleStrains.rows.forEach((strain) => {
        console.log(
          `   🌿 ${strain.name} (${strain.type}) - ${strain.dominant_terpene} dominant, THC: ${strain.thc_max}%`
        );
      });
    } else {
      console.log("⚠️  No strains found in database");
    }
    console.log("");

    // Check users data
    console.log("4. Checking users data...");
    const userCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM users"
    );
    const userCount = parseInt(userCountResult.rows[0].count);
    console.log(`👥 Total users: ${userCount}`);

    if (userCount > 0) {
      const sampleUsers = await pool.query(`
        SELECT pin, created_at, is_universal 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 3
      `);

      console.log("Recent users:");
      sampleUsers.rows.forEach((user) => {
        console.log(
          `   🔑 PIN: ${user.pin} (${
            user.is_universal ? "Universal" : "Local"
          }) - ${user.created_at}`
        );
      });
    } else {
      console.log("ℹ️  No users found in database");
    }
    console.log("");

    // Check Washington products
    console.log("5. Checking Washington products...");
    const productCountResult = await pool.query(
      "SELECT COUNT(*) as count FROM washington_products"
    );
    const productCount = parseInt(productCountResult.rows[0].count);
    console.log(`🏪 Total WA products: ${productCount}`);

    if (productCount > 0) {
      const sampleProducts = await pool.query(`
        SELECT brand, product_name, 
               (per_serving->>'THC')::text as thc_per_serving,
               (per_serving->>'CBD')::text as cbd_per_serving
        FROM washington_products 
        LIMIT 3
      `);

      console.log("Sample products:");
      sampleProducts.rows.forEach((product) => {
        console.log(
          `   🧪 ${product.brand} - ${product.product_name} (${
            product.thc_per_serving || 0
          }mg THC, ${product.cbd_per_serving || 0}mg CBD)`
        );
      });
    }
    console.log("");

    // Summary
    console.log("📋 SUMMARY:");
    console.log(`   Tables: ${tablesResult.rows.length}`);
    console.log(`   Strains: ${strainCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   WA Products: ${productCount}`);

    if (strainCount === 69) {
      console.log("✅ All strain data appears to be loaded correctly!");
    } else if (strainCount === 0) {
      console.log("⚠️  No strain data found - migration may have failed");
    } else {
      console.log(
        `⚠️  Expected 69 strains, found ${strainCount} - partial migration?`
      );
    }
  } catch (error) {
    console.error("❌ Database test failed:", error.message);

    if (error.message.includes("does not exist")) {
      console.log("\n💡 Solution: Run database setup first:");
      console.log("   curl -X POST http://localhost:3000/api/setup-database");
    } else if (error.message.includes("connection")) {
      console.log("\n💡 Check your XATA_DATABASE_URL in .env.local");
    }
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log("\n🏁 Database test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
    process.exit(1);
  });
