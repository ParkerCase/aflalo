// tests/setup.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configure Sharp for testing
sharp.cache(false);
sharp.concurrency(1);
sharp.simd(true);

// Set up global test configuration
global.TEST_TIMEOUT = 30000;
global.SAMPLE_IMAGES_DIR = path.join(__dirname, 'samples');

// Create test directories if they don't exist
beforeAll(async () => {
  try {
    await fs.mkdir(global.SAMPLE_IMAGES_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating test directories:', error);
    throw error;
  }
});

// Clean up test artifacts
afterAll(async () => {
  try {
    const files = await fs.readdir(global.SAMPLE_IMAGES_DIR);
    await Promise.all(
      files.map(file => 
        fs.unlink(path.join(global.SAMPLE_IMAGES_DIR, file))
      )
    );
  } catch (error) {
    console.error('Error cleaning up test artifacts:', error);
  }
});

// Add custom matchers
expect.extend({
  toBeValidSignature(received) {
    const isValid = received &&
      typeof received === 'object' &&
      received.version === '2.0' &&
      received.timestamp &&
      received.metadata &&
      received.colors &&
      received.edges &&
      received.textures &&
      received.hashes &&
      received.quality;

    return {
      message: () =>
        `expected ${received} to be a valid signature object`,
      pass: isValid,
    };
  },
});

// Memory leak detection
beforeEach(() => {
  if (global.gc) {
    global.gc();
  }
  const memoryBefore = process.memoryUsage();
  global.__TEST_MEMORY_USAGE__ = memoryBefore;
});

afterEach(() => {
  if (global.gc) {
    global.gc();
  }
  const memoryAfter = process.memoryUsage();
  const memoryBefore = global.__TEST_MEMORY_USAGE__;
  
  const heapDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;
  if (heapDiff > 50 * 1024 * 1024) { // 50MB threshold
    console.warn(`Possible memory leak detected: ${Math.round(heapDiff / 1024 / 1024)}MB increase`);
  }
});