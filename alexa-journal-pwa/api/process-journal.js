// Serverless function to process journal entries with OpenAI Vision API
// This keeps the API key secure on the server side

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB max
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

// Rate limiting (simple in-memory store - for production, use Redis or similar)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= RATE_LIMIT_MAX) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    return true;
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           'unknown';
}

async function callOpenAIWithRetry(imageBase64, retries = MAX_RETRIES) {
    const apiKey = process.env.OPEN_AI_API || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('OpenAI API key not configured. Please set OPEN_AI_API environment variable.');
    }
    
    const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are a compassionate therapist providing gentle, encouraging reflections on journal entries. Focus on validation, growth, and self-compassion. Keep responses warm, brief (3-4 sentences), and supportive.'
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'Please read this journal entry and provide a brief, compassionate reflection. Focus on what shows growth, self-awareness, or courage. Offer gentle encouragement.'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageBase64
                        }
                    }
                ]
            }
        ],
        max_tokens: 200
    };
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle rate limiting
                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after') || Math.pow(2, attempt);
                    if (attempt < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                        continue;
                    }
                    throw new Error('OpenAI API is currently rate limited. Please try again in a moment.');
                }
                
                // Handle other errors
                const errorMessage = errorData.error?.message || `OpenAI API error: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Unexpected response format from OpenAI API');
            }
            
            return data.choices[0].message.content;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again with a smaller image.');
            }
            
            if (attempt === retries - 1) {
                // Last attempt failed
                if (error.message.includes('rate limit')) {
                    throw error;
                }
                throw new Error(`Unable to process journal entry. ${error.message}`);
            }
            
            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Vercel serverless function handler
// Supports both CommonJS and ES modules
async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Rate limiting
        const clientIP = getClientIP(req);
        if (!checkRateLimit(clientIP)) {
            return res.status(429).json({ 
                error: 'Too many requests. Please wait a moment before trying again.' 
            });
        }
    
        // Validate request body
        const { imageBase64 } = req.body;
        
        if (!imageBase64) {
            return res.status(400).json({ error: 'Missing image data' });
        }
        
        // Check size (rough estimate - base64 is ~33% larger than binary)
        if (imageBase64.length > MAX_REQUEST_SIZE) {
            return res.status(400).json({ 
                error: 'Image too large. Please use a smaller image (max 10MB).' 
            });
        }
        
        // Validate base64 format
        if (!imageBase64.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Invalid image format' });
        }
        
        // Process with OpenAI
        const reflection = await callOpenAIWithRetry(imageBase64);
        
        // Return success (never log the content for privacy)
        return res.status(200).json({ 
            reflection,
            success: true
        });
        
    } catch (error) {
        // Log error (but not journal content) for debugging
        console.error('Journal processing error:', {
            error: error.message,
            timestamp: new Date().toISOString(),
            // Intentionally not logging image or content
        });
        
        // Return user-friendly error
        return res.status(500).json({ 
            error: error.message || 'Unable to process journal entry. Please try again.',
            success: false
        });
    }
}

// Export for Vercel serverless function
module.exports = handler;

