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
    
    console.log('Checking API key...', apiKey ? 'Key found (length: ' + apiKey.length + ')' : 'KEY MISSING!');
    
    if (!apiKey) {
        console.error('OpenAI API key not configured!');
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
                        text: 'Please read this handwritten journal entry carefully. Provide ONLY a brief, compassionate reflection (3-4 sentences) on what the person wrote. Focus on what shows growth, self-awareness, or courage. Offer gentle encouragement. Do NOT include the extracted text - only provide your reflection. If you cannot read the handwriting clearly, do your best to understand the general sentiment and provide supportive feedback based on what you can discern.'
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
            
            console.log('OpenAI API response received, has choices:', !!data.choices);
            
            if (data.error) {
                console.error('OpenAI API error:', data.error);
                throw new Error(data.error.message);
            }
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Unexpected OpenAI response format:', JSON.stringify(data).substring(0, 200));
                throw new Error('Unexpected response format from OpenAI API');
            }
            
            const content = data.choices[0].message.content;
            console.log('OpenAI returned content, length:', content ? content.length : 0);
            
            if (!content || content.trim().length === 0) {
                throw new Error('OpenAI returned empty content');
            }
            
            return content;
            
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
        
        // Validate base64 format - accept any image format (we convert on client side)
        if (!imageBase64.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Invalid image format' });
        }
        
        // Extract format from data URL for logging
        const imageFormat = imageBase64.match(/data:image\/([^;]+)/);
        const format = imageFormat ? imageFormat[1] : 'unknown';
        console.log('Received image format:', format);
        
        // If it's not a supported format, try to convert it (but client should handle this)
        // OpenAI Vision API accepts: png, jpeg, gif, webp
        const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
        if (!supportedFormats.includes(format.toLowerCase())) {
            console.warn('Unsupported format received:', format, '- client should have converted this');
            // Don't reject here - let OpenAI handle it, but log the issue
        }
        
        // Process with OpenAI
        console.log('Calling OpenAI API with image (size:', imageBase64.length, 'chars)');
        console.log('Image preview (first 100 chars):', imageBase64.substring(0, 100));
        
        let reflection;
        try {
            reflection = await callOpenAIWithRetry(imageBase64);
            console.log('OpenAI returned reflection, length:', reflection ? reflection.length : 0);
        } catch (openAIError) {
            console.error('OpenAI API call failed:', openAIError.message);
            console.error('Error stack:', openAIError.stack);
            throw openAIError; // Re-throw to be caught by outer catch
        }
        
        if (!reflection || reflection.trim().length === 0) {
            console.error('OpenAI returned empty reflection');
            return res.status(500).json({ 
                error: 'Received empty response from AI. Please try again.',
                success: false
            });
        }
        
        console.log('Successfully processed journal entry, returning reflection');
        
        // Return success (never log the content for privacy)
        return res.status(200).json({ 
            reflection,
            success: true
        });
        
    } catch (error) {
        // Log error (but not journal content) for debugging
        console.error('Journal processing error:', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            // Intentionally not logging image or content
        });
        
        // Return user-friendly error
        const errorMessage = error.message || 'Unable to process journal entry. Please try again.';
        return res.status(500).json({ 
            error: errorMessage,
            success: false
        });
    }
}

// Export for Vercel serverless function
module.exports = handler;

