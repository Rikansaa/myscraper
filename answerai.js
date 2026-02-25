// @author Rizki
// @title Answer Generator
// @description The AI Answer Generator is fast, reliable, and always accurate. It's a fantastic resource that saves me hours of research
// @baseurl https:notegpt.io/ai-answer-generator
// @tags ai
// @language javascript

const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');

async function uploadToCatbox(imagePath) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', fs.createReadStream(imagePath));
    
    const response = await axios.post('https://catbox.moe/user/api.php', formData, {
        headers: formData.getHeaders(),
        timeout: 30000
    });
    
    return response.data.trim();
}

async function generateUUID() {
    return crypto.randomUUID();
}

async function noteGptAnswer(imagePath, prompt = "whats its is?") {
    const imageUrl = await uploadToCatbox(imagePath);
    const conversationId = await generateUUID();
    
    const payload = {
        message: prompt,
        language: "auto",
        model: "gemini-3-flash-preview",
        tone: "default",
        length: "moderate",
        conversation_id: conversationId,
        image_urls: [imageUrl],
        stream_url: "/api/v2/homework/stream"
    };

    const response = await axios.post(
        'https://notegpt.io/api/v2/homework/stream',
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://notegpt.io',
                'Referer': 'https://notegpt.io/ai-answer-generator',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
                'Cookie': '_gid=GA1.2.49691950.1772022781; anonymous_user_id=9b6fcdfb-7b17-4154-b56a-80f7f9092a0a; sbox-guid=MTc3MjAyMjc4M3wzMTZ8OTIwMDQwMDY4; _ga_PFX3BRW5RQ=GS2.1.s1772022777$o1$g1$t1772023460$j60$l0$h1237640933; _ga=GA1.2.992645210.1772022778'
            },
            timeout: 60000,
            responseType: 'stream'
        }
    );

    let fullText = '';
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Stream timeout'));
        }, 60000);

        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const jsonStr = line.slice(6);
                        if (jsonStr === '') continue;
                        const data = JSON.parse(jsonStr);
                        if (data.text) {
                            fullText += data.text;
                        }
                        if (data.done) {
                            clearTimeout(timeout);
                            resolve(fullText);
                        }
                    } catch (e) {}
                }
            }
        });

        response.data.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        response.data.on('end', () => {
            clearTimeout(timeout);
            if (fullText) {
                resolve(fullText);
            } else {
                reject(new Error('Stream ended without data'));
            }
        });
    });
}

(async () => {
    const result = await noteGptAnswer('images.jpeg', '');
    console.log(result);
})();