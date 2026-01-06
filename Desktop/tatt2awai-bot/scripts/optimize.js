// scripts/optimize.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { OptimizedSignatureGenerator } = require('../optimizedSignatureGenerator');

async function optimizeSignatureGeneration() {
  console.log('Starting signature generation optimization...');
  
  // Configure Sharp globally
  sharp.cache(false);
  sharp.concurrency(1);
  sharp.simd(true);

  try {
    const generator = new OptimizedSignatureGenerator({
      maxImageSize: 2048,
      compressionQuality: 90,
      maxFeaturePoints: 1000,
      cacheSize: 100,
      TEXTURE: {
        GABOR_ORIENTATIONS: [0, 30, 60, 90, 120, 150],
        GABOR_FREQUENCIES: [0.1, 0.2, 0.3, 0.4],
        LBP_RADIUS: 2,
        GLCM_DISTANCES: [1, 2, 4]
      },
      COLOR: {
        COLOR_QUANT_LEVELS: {
          RGB: 64,
          LAB: 32,
          HSV: 48
        }
      }
    });

    // Run optimization tests
    await runOptimizationTests(generator);

    // Verify optimization results
    await verifyOptimization(generator);

    console.log('Signature generation optimization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Optimization failed:', error);
    process.exit(1);
  }
}

async function runOptimizationTests(generator) {
  console.log('Running optimization tests...');
  
  const samples = await generateTestSamples();
  const results = [];

  for (const sample of samples) {
    const startTime = process.hrtime.bigint();
    const result = await generator.generateSignature(sample.buffer);
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;

    results.push({
      size: sample.buffer.length,
      duration,
      quality: result.quality.overall,
      memoryUsage: process.memoryUsage().heapUsed
    });

    // Force garbage collection between tests
    if (global.gc) {
      global.gc();
    }

    // Allow event loop to clear
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Analyze results and adjust configuration
  optimizeConfiguration(generator, results);
}

async function generateTestSamples() {
  const samples = [];
  const sizes = [1024, 2048, 4096]; // Test different image sizes
  const testPatterns = ['gradient', 'solid', 'noise', 'complex'];

  for (const size of sizes) {
    for (const pattern of testPatterns) {
      const buffer = await generateTestImage(size, pattern);
      samples.push({ buffer, size, pattern });
    }
  }

  return samples;
}

async function generateTestImage(size, pattern) {
  const image = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  });

  switch (pattern) {
    case 'gradient':
      return image
        .linear(2, 0)
        .jpeg()
        .toBuffer();
    case 'solid':
      return image
        .jpeg()
        .toBuffer();
    case 'noise':
      return image
        .noise('gaussian', 0.5)
        .jpeg()
        .toBuffer();
    case 'complex':
      return image
        .composite([
          { input: await generateTestPattern(size), blend: 'overlay' }
        ])
        .jpeg()
        .toBuffer();
  }
}

async function generateTestPattern(size) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: Buffer.from([255, 0, 0, 255]), blend: 'add', tile: true },
      { input: Buffer.from([0, 255, 0, 255]), blend: 'add', tile: true, left: size / 4 },
      { input: Buffer.from([0, 0, 255, 255]), blend: 'add', tile: true, top: size / 4 }
    ])
    .jpeg()
    .toBuffer();
}

function optimizeConfiguration(generator, results) {
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length;
  const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;

  // Adjust configuration based on results
  const newConfig = {
    maxImageSize: avgDuration > 1000 ? 1024 : 2048,
    compressionQuality: avgQuality < 0.8 ? 95 : 90,
    maxFeaturePoints: avgMemory > 512 * 1024 * 1024 ? 500 : 1000,
    cacheSize: Math.min(Math.max(50, Math.floor(1000 / avgDuration)), 200)
  };

  // Apply optimized configuration
  Object.assign(generator.config, newConfig);

  console.log('Optimized configuration:', newConfig);
  
  // Save configuration for future runs
  saveOptimizedConfig(newConfig);
}

async function verifyOptimization(generator) {
  console.log('Verifying optimization results...');

  const verificationSample = await generateTestImage(2048, 'complex');
  const startTime = process.hrtime.bigint();
  const result = await generator.generateSignature(verificationSample);
  const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;

  const verificationResults = {
    duration,
    quality: result.quality.overall,
    memoryUsage: process.memoryUsage().heapUsed
  };

  console.log('Verification results:', verificationResults);

  // Ensure optimization meets requirements
  const requirements = {
    maxDuration: 2000, // 2 seconds
    minQuality: 0.7,
    maxMemory: 1024 * 1024 * 1024 // 1GB
  };

  if (
    verificationResults.duration > requirements.maxDuration ||
    verificationResults.quality < requirements.minQuality ||
    verificationResults.memoryUsage > requirements.maxMemory
  ) {
    throw new Error('Optimization verification failed');
  }
}

async function saveOptimizedConfig(config) {
  const configPath = path.join(__dirname, '..', 'config', 'optimized.json');
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving optimized configuration:', error);
  }
}

// Run optimization
optimizeSignatureGeneration().catch(console.error);