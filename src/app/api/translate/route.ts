// ============================================================================
// API Route: Translate - Traduction automatique gratuite
// Utilise Google Translate via requête HTTP directe
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { text, targetLang, sourceLang } = await request.json();

        console.log('[API /translate] Request received:', {
            textPreview: text.substring(0, 50) + '...',
            targetLang,
            sourceLang: sourceLang || 'auto',
        });

        // Validation
        if (!text || !targetLang) {
            return NextResponse.json(
                { error: 'Text and targetLang are required' },
                { status: 400 }
            );
        }

        // Si le texte est vide ou trop court, le retourner tel quel
        if (text.trim().length === 0) {
            return NextResponse.json({ translatedText: text, detectedSourceLang: sourceLang || 'fr' });
        }

        // Si la langue source et cible sont identiques, retourner le texte original
        if (sourceLang && sourceLang === targetLang) {
            return NextResponse.json({ translatedText: text, detectedSourceLang: sourceLang });
        }

        // Traduire avec retry (max 3 tentatives)
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                // Utiliser l'API Google Translate directement
                const url = new URL('https://translate.googleapis.com/translate_a/single');
                url.searchParams.set('client', 'gtx');
                url.searchParams.set('sl', sourceLang || 'auto');
                url.searchParams.set('tl', targetLang);
                url.searchParams.set('dt', 't');
                url.searchParams.set('q', text);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Extraire la traduction de la réponse
                let translatedText = '';
                if (data && data[0]) {
                    for (const item of data[0]) {
                        if (item[0]) {
                            translatedText += item[0];
                        }
                    }
                }

                if (!translatedText) {
                    throw new Error('Empty translation result');
                }

                console.log('[API /translate] Translation successful:', {
                    sourceLang: sourceLang || 'auto',
                    targetLang,
                    resultPreview: translatedText.substring(0, 50) + '...',
                });

                return NextResponse.json({
                    translatedText,
                    detectedSourceLang: data[2] || sourceLang || 'fr',
                });
            } catch (error: any) {
                lastError = error;
                console.error(`Translation attempt ${attempt} failed:`, error.message);

                // Attendre un peu avant de réessayer
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
            }
        }

        // Si toutes les tentatives échouent, retourner le texte original
        console.error('All translation attempts failed:', lastError);
        return NextResponse.json({
            translatedText: text,
            detectedSourceLang: sourceLang || 'fr',
            error: 'Translation failed, returning original text',
            fallback: true,
        });

    } catch (error: any) {
        console.error('Translation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
