import fs from 'fs';
import path from 'path';

const API_KEY = "AIzaSyDgyWwwmHOROsPZclCm-LGzZs_uoYNhVDk";
const API_URL = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

const TARGET_LANGS = [
    'es', 'fr', 'pt', 'de', 'ar', 'hi', 'bn', 'zh-CN', 'ja',
    'id', 'tr', 'vi', 'ko', 'ru', 'it', 'pl', 'th', 'tl'
];

async function translateText(text, targetLang) {
    if (!text) return text;
    // Don't translate emojis or purely symbols if possible, but API handles strings fine.
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                target: targetLang,
                source: 'en',
                format: 'text'
            })
        });
        const data = await response.json();
        if (data.data && data.data.translations && data.data.translations[0]) {
            return data.data.translations[0].translatedText;
        }
        return text;
    } catch (e) {
        console.error(`Failed to translate "${text}" to ${targetLang}`, e);
        return text;
    }
}

async function translateObject(obj, targetLang) {
    const translated = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            translated[key] = await translateObject(value, targetLang);
        } else if (typeof value === 'string') {
            translated[key] = await translateText(value, targetLang);
        } else {
            translated[key] = value; // copy numbers/booleans directly
        }
    }
    return translated;
}

async function main() {
    const enFilePath = path.join(process.cwd(), 'src', 'locales', 'en', 'translation.json');
    const enData = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));

    for (const lang of TARGET_LANGS) {
        console.log(`Translating to ${lang}...`);
        const translatedData = await translateObject(enData, lang);

        const langDir = path.join(process.cwd(), 'src', 'locales', lang);
        if (!fs.existsSync(langDir)) {
            fs.mkdirSync(langDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(langDir, 'translation.json'),
            JSON.stringify(translatedData, null, 2),
            'utf8'
        );
        console.log(`Saved ${lang}/translation.json`);
    }
}

main().catch(console.error);
