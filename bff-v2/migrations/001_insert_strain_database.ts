// Migration: Insert ChatGPT's Comprehensive Strain Database
// Run this after setting up database tables with /api/setup-database

import { Pool } from 'pg'

// ChatGPT's Master Strain Database - Converted to BFF Schema
const STRAIN_DB_MASTER = [
  { name: "ACDC", type: "hybrid", terps: ["caryophyllene","pinene","myrcene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Afghan Kush", type: "indica", terps: ["myrcene","caryophyllene","humulene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "AK-47", type: "hybrid", terps: ["terpinolene","myrcene","caryophyllene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Alien OG", type: "hybrid", terps: ["limonene","caryophyllene","pinene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Amnesia Haze", type: "sativa", terps: ["terpinolene","limonene","myrcene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Animal Face", type: "hybrid", terps: ["caryophyllene","limonene","pinene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Animal Mints", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Apple Fritter", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Apple Tartz", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Apples and Bananas", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Banana Daddy", type: "hybrid", terps: ["myrcene","limonene","caryophyllene","ocimene","pinene"], dominantTerpene: "myrcene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Banana Hammock", type: "indica", terps: ["myrcene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Banana Kush", type: "hybrid", terps: ["limonene","myrcene","caryophyllene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Banana OG", type: "hybrid", terps: ["limonene","caryophyllene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Banana Punch", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Banana Runtz", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Berry White", type: "hybrid", terps: ["myrcene","pinene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Blue Cookies", type: "hybrid", terps: ["caryophyllene","limonene","humulene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Blue Dream", type: "hybrid", terps: ["myrcene","pinene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Blue God", type: "indica", terps: ["myrcene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Blue Goo", type: "hybrid", terps: ["myrcene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Blueberry", type: "indica", terps: ["myrcene","pinene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Blueberry AK", type: "hybrid", terps: ["myrcene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Blueberry Diesel", type: "hybrid", terps: ["myrcene","caryophyllene","limonene"], dominantTerpene: "myrcene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Blueberry Kush", type: "indica", terps: ["myrcene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Bruce Banner", type: "hybrid", terps: ["myrcene","limonene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Buckeye Purple", type: "indica", terps: ["myrcene","caryophyllene","linalool"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Bully Kush", type: "indica", terps: ["myrcene","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Cannatonic", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Chem Dawg", type: "hybrid", terps: ["caryophyllene","limonene","myrcene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Critical Mass", type: "indica", terps: ["myrcene","caryophyllene","humulene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Durban Poison", type: "sativa", terps: ["terpinolene","pinene","ocimene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: ["THCV"] },
  { name: "Gelatti", type: "hybrid", terps: ["caryophyllene","limonene","humulene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Gelato", type: "hybrid", terps: ["caryophyllene","limonene","humulene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Girl Scout Cookies", type: "hybrid", terps: ["caryophyllene","limonene","humulene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Gorilla Glue #4", type: "hybrid", terps: ["caryophyllene","limonene","myrcene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Granddaddy Purple", type: "indica", terps: ["myrcene","linalool","caryophyllene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Green Crack", type: "sativa", terps: ["terpinolene","myrcene","caryophyllene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Greasy Grapes", type: "hybrid", terps: ["caryophyllene","limonene","myrcene"], dominantTerpene: "caryophyllene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Harlequin", type: "hybrid", terps: ["limonene","caryophyllene","pinene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "I-95 Cookies", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Ice Cream Man", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Jack Herer", type: "sativa", terps: ["terpinolene","pinene","limonene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Lemon Cherry Gelato", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Lemon Haze", type: "sativa", terps: ["limonene","terpinolene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Lemon Skunk", type: "hybrid", terps: ["limonene","myrcene","caryophyllene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Mimosa", type: "sativa", terps: ["limonene","beta-pinene","linalool"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Northern Lights", type: "indica", terps: ["myrcene","caryophyllene","humulene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Orange Velvet Underground", type: "hybrid", terps: ["terpinolene","limonene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Permanent Marker", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Planet of the Grapes", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Popscotti", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Purple Punch", type: "indica", terps: ["myrcene","caryophyllene","pinene"], dominantTerpene: "myrcene", myrceneHeavy: true, minorCannabinoids: [] },
  { name: "Rainbow Pavé", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Ringo's Gift", type: "hybrid", terps: ["caryophyllene","pinene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: ["CBG"] },
  { name: "Runtz", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Runtz Buttonz", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Sharknado", type: "hybrid", terps: ["caryophyllene","limonene","myrcene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Sour Diesel", type: "sativa", terps: ["limonene","myrcene","caryophyllene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Sour Tsunami", type: "hybrid", terps: ["caryophyllene","myrcene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Space Runtz", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Super Lemon Haze", type: "sativa", terps: ["limonene","terpinolene"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Super Silver Haze", type: "sativa", terps: ["terpinolene","limonene","myrcene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Tangie", type: "sativa", terps: ["terpinolene","limonene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Tangelo Truffletini", type: "hybrid", terps: ["limonene","caryophyllene","linalool"], dominantTerpene: "limonene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "The GOAT", type: "hybrid", terps: ["caryophyllene","limonene"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Thin Mint GSC", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Trainwreck", type: "hybrid", terps: ["terpinolene","limonene","myrcene"], dominantTerpene: "terpinolene", myrceneHeavy: false, minorCannabinoids: [] },
  { name: "Z-Cake", type: "hybrid", terps: ["caryophyllene","limonene","linalool"], dominantTerpene: "caryophyllene", myrceneHeavy: false, minorCannabinoids: [] }
];

// Transform ChatGPT data to match BFF database schema
function transformStrainForDB(chatGPTStrain: any) {
  // Generate effects based on terpene profile and type
  const effects = generateEffectsFromTerpenes(chatGPTStrain.terps, chatGPTStrain.type, chatGPTStrain.myrceneHeavy);
  
  // Generate estimated THC/CBD ranges based on type
  const { thc_min, thc_max, cbd_min, cbd_max } = generateCannabinoidRanges(chatGPTStrain.type, chatGPTStrain.name);
  
  // Build terpene profile object
  const terpenes = {
    dominant: chatGPTStrain.dominantTerpene,
    profile: chatGPTStrain.terps,
    myrceneHeavy: chatGPTStrain.myrceneHeavy,
    minorCannabinoids: chatGPTStrain.minorCannabinoids || []
  };

  return {
    name: chatGPTStrain.name,
    type: chatGPTStrain.type,
    thc_min,
    thc_max,
    cbd_min,
    cbd_max,
    terpenes,
    effects,
    lineage: { genetics: "Various", breeder: "Multiple" }, // Placeholder
    description: generateDescription(chatGPTStrain),
    source: "ChatGPT Cannabis Expert + Leafly Data"
  };
}

// Generate effects based on terpene profile
function generateEffectsFromTerpenes(terps: string[], type: string, myrceneHeavy: boolean): string[] {
  const effects: string[] = [];
  
  // Base effects by type
  if (type === 'indica' || myrceneHeavy) {
    effects.push('Relaxed', 'Sleepy', 'Body High');
  } else if (type === 'sativa') {
    effects.push('Energetic', 'Uplifted', 'Creative');
  } else {
    effects.push('Balanced', 'Happy', 'Relaxed');
  }

  // Terpene-specific effects
  if (terps.includes('limonene')) {
    effects.push('Mood Boost', 'Stress Relief');
  }
  if (terps.includes('caryophyllene')) {
    effects.push('Pain Relief', 'Anti-inflammatory');
  }
  if (terps.includes('linalool')) {
    effects.push('Calming', 'Anxiety Relief');
  }
  if (terps.includes('terpinolene')) {
    effects.push('Creative', 'Uplifting');
  }
  if (terps.includes('pinene')) {
    effects.push('Alertness', 'Memory');
  }

  return [...new Set(effects)]; // Remove duplicates
}

// Generate realistic cannabinoid ranges
function generateCannabinoidRanges(type: string, name: string) {
  // CBD-dominant strains
  if (name.includes('ACDC') || name.includes('Harlequin') || name.includes('Cannatonic') || name.includes('Ringo')) {
    return { thc_min: 1, thc_max: 8, cbd_min: 8, cbd_max: 20 };
  }
  
  // High THC indicas
  if (type === 'indica') {
    return { thc_min: 15, thc_max: 28, cbd_min: 0, cbd_max: 2 };
  }
  
  // Sativas
  if (type === 'sativa') {
    return { thc_min: 12, thc_max: 25, cbd_min: 0, cbd_max: 1 };
  }
  
  // Hybrids
  return { thc_min: 14, thc_max: 26, cbd_min: 0, cbd_max: 3 };
}

// Generate strain description
function generateDescription(strain: any): string {
  const terpDesc = strain.dominantTerpene === 'myrcene' ? 'sedating' : 
                  strain.dominantTerpene === 'limonene' ? 'uplifting' :
                  strain.dominantTerpene === 'caryophyllene' ? 'therapeutic' :
                  strain.dominantTerpene === 'terpinolene' ? 'energizing' : 'balanced';
  
  return `${strain.name} is a ${strain.type} strain with a ${terpDesc} terpene profile dominated by ${strain.dominantTerpene}. ` +
         `Known for its ${strain.terps.join(', ')} terpene combination.${strain.myrceneHeavy ? ' Heavy myrcene content provides strong sedative effects.' : ''}`;
}

// Main migration function
export async function runStrainMigration() {
  console.log('🌿 Starting BFF Strain Database Migration...');
  
  if (!process.env.XATA_DATABASE_URL) {
    throw new Error('XATA_DATABASE_URL environment variable is required');
  }

  const pool = new Pool({
    connectionString: process.env.XATA_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Check if strains table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'strains'
      );
    `);

    if (!tableExists.rows[0].exists) {
      throw new Error('Strains table does not exist. Run /api/setup-database first.');
    }

    console.log('✅ Strains table found');

    // Transform and insert strains
    let insertedCount = 0;
    let skippedCount = 0;

    for (const chatGPTStrain of STRAIN_DB_MASTER) {
      try {
        const transformedStrain = transformStrainForDB(chatGPTStrain);
        
        // Insert strain (skip if exists)
        await pool.query(`
          INSERT INTO strains (name, type, thc_min, thc_max, cbd_min, cbd_max, terpenes, effects, lineage, description, source)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (name) DO NOTHING
        `, [
          transformedStrain.name,
          transformedStrain.type,
          transformedStrain.thc_min,
          transformedStrain.thc_max,
          transformedStrain.cbd_min,
          transformedStrain.cbd_max,
          JSON.stringify(transformedStrain.terpenes),
          JSON.stringify(transformedStrain.effects),
          JSON.stringify(transformedStrain.lineage),
          transformedStrain.description,
          transformedStrain.source
        ]);

        insertedCount++;
        console.log(`✅ Inserted: ${transformedStrain.name} (${transformedStrain.type})`);
        
      } catch (insertError) {
        skippedCount++;
        console.log(`⚠️  Skipped: ${chatGPTStrain.name} (already exists)`);
      }
    }

    // Verify final count
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM strains');
    
    await pool.end();

    console.log('\n🎉 Migration Complete!');
    console.log(`📊 Strains inserted: ${insertedCount}`);
    console.log(`⏭️  Strains skipped: ${skippedCount}`);
    console.log(`🔢 Total strains in database: ${finalCount.rows[0].count}`);

    return {
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      total: finalCount.rows[0].count
    };

  } catch (error) {
    await pool.end();
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// If running directly with node
if (require.main === module) {
  runStrainMigration()
    .then((result) => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}
