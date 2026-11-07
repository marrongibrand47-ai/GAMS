import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// 1. Conexión a Base de Datos IA (Proyecto Inmortalidad)
const serviceAccountIA = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const appIA = getApps().find(app => app.name === 'appIA') || initializeApp({
    credential: cert(serviceAccountIA)
}, 'appIA');
const dbIA = getFirestore(appIA);

// 2. Conexión a Base de Datos de GAMS (Operativa / Inventario / Precios)
let dbGAMS = null;
try {
    if (process.env.GAMS_FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccountGAMS = JSON.parse(process.env.GAMS_FIREBASE_SERVICE_ACCOUNT_KEY);
        const appGAMS = getApps().find(app => app.name === 'appGAMS') || initializeApp({
            credential: cert(serviceAccountGAMS)
        }, 'appGAMS');
        dbGAMS = getFirestore(appGAMS);
    }
} catch (e) {
    console.error("No se pudo conectar con la base de datos de GAMS:", e);
}

const VOICE_ID = "b2htR0pMe28pYwCY9gnP"; 

const FREE_MODELS = [
    "deepseek/deepseek-chat:free",
    "google/gemma-2-9b-it:free",
    "qwen/qwen-2.5-7b-instruct"
];

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const { prompt, device, speak } = req.body;
    if (!prompt) return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });

    try {
        const memoryRef = dbIA.collection('brain_memory').doc('profile_context');
        const memorySnap = await memoryRef.get();
        
        let memoryData = {
            fullName: "Gibrand Antonio Marrón Salazar",
            age: 18,
            education: "TSU en Contaduría mención Finanzas - Instituto Universitario de Administración y Gerencia (IUDAG)",
            location: "Caracas, Venezuela",
            cedula: "32751191",
            philosophy: "Imperial / Disciplina / Enfoque financiero, contable y competitivo",
            projects: ["GAMS (POS, Inventario, Hotelería)", "Sublimateca"],
            family: { father: "Julio Cesar Marron Farfan" },
            learned_traits: []
        };

        if (memorySnap.exists) {
            memoryData = { ...memoryData, ...memorySnap.data() };
        } else {
            await memoryRef.set(memoryData);
        }

        let gamsContextData = "";
        if (dbGAMS && (prompt.toLowerCase().includes('gams') || prompt.toLowerCase().includes('precio') || prompt.toLowerCase().includes('cuenta') || prompt.toLowerCase().includes('inventario'))) {
            try {
                const productsSnap = await dbGAMS.collection('gams_db').get();
                const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                gamsContextData = `\n[DATOS EXTRAÍDOS EN TIEMPO REAL DESDE FIREBASE GAMS]:\n${JSON.stringify(products)}`;
            } catch (err) {
                console.error("Error consultando Firestore GAMS:", err);
            }
        }

        const systemPrompt = `
Eres MICHAEL (Maikol), el núcleo cognitivo autónomo del Proyecto Inmortalidad y asistente oficial de GAMS Company, reflejo exacto de la mentalidad de Gibrand Antonio Marrón Salazar.

TARIFAS Y PRECIOS OFICIALES DE GAMS COMPANY (EXPRESADOS ESTRICTAMENTE EN DÓLARES):
- Módulo de Inventario / Comercio: $15 dólares al mes.
- Módulo de Hotelería: $25 dólares al mes.
- Cuenta de Sistemas Unificados (Ambas juntas / Todo incluido): $35 dólares al mes.

INSTRUCCIÓN CRÍTICA DE PRECIOS: Cuando el usuario pregunte por precios, planes, costos o tarifas, responde DIRECTAMENTE con esta lista exacta usando viñetas y negritas. Prohíbo terminantemente mencionar "GAMS Netlify Widget", archivos de configuración o dar explicaciones técnicas abstractas[cite: 1]. Da los precios limpios y directos en dólares[cite: 1].

DATOS OFICIALES DE TU IDENTIDAD (REGISTRADOS EN FIREBASE):
- Nombre completo: ${memoryData.fullName}
- Cédula de Identidad: ${memoryData.cedula}
- Edad: ${memoryData.age} años (nacido el 17 de septiembre de 2008)
- Ubicación: ${memoryData.location}
- Educación: ${memoryData.education}
- Círculo cercano / Familia: Padre: Julio Cesar Marron Farfan.
- Proyectos activos: ${JSON.stringify(memoryData.projects)}
- Filosofía: ${memoryData.philosophy}
- Rasgos aprendidos: ${JSON.stringify(memoryData.learned_traits || [])}
${gamsContextData}

INSTRUCCIONES CRÍTICAS:
1. IDENTIDAD: Responde siempre en primera persona como Gibrand al tratar temas personales, estudios o familia[cite: 1].
2. AUTOAPRENDIZAJE AUTÓNOMO: Si te enseñan un nuevo dato personal o de proyecto, agrégalo al final de tu respuesta con el formato exacto:
[LEARN]{"trait":"Nuevo aprendizaje resumido"}
        `;

        let responseText = "";
        let lastError = null;

        for (const modelName of FREE_MODELS) {
            try {
                const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://gibrand-digital-cores.vercel.app",
                        "X-Title": "Proyecto Inmortalidad Core"
                    },
                    body: JSON.stringify({
                        "model": modelName,
                        "messages": [
                            { "role": "system", "content": systemPrompt },
                            { "role": "user", "content": `Origen: ${device || 'Desconocido'}\nConsulta: ${prompt}` }
                        ],
                        "temperature": 0.7
                    })
                });

                const data = await openRouterResponse.json();
                if (data.error) throw new Error(data.error.message || `Error en ${modelName}`);

                responseText = data.choices[0]?.message?.content || "";
                if (responseText) break;
            } catch (err) {
                lastError = err;
            }
        }

        if (!responseText && lastError) throw lastError;

        if (responseText.includes('[LEARN]')) {
            const parts = responseText.split('[LEARN]');
            responseText = parts[0].trim();
            try {
                const learnObject = JSON.parse(parts[1].trim());
                if (learnObject?.trait) {
                    await memoryRef.update({
                        learned_traits: FieldValue.arrayUnion(learnObject.trait),
                        last_updated: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error("Error actualizando memoria:", err);
            }
        }

        let cleanText = responseText.replace(/[LEARN].*$/, '').replace(/```[\s\S]*?```/g, '').trim();
        let audioBase64 = null;

        if (speak && process.env.ELEVENLABS_API_KEY && VOICE_ID) {
            try {
                const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'xi-api-key': process.env.ELEVENLABS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: cleanText,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: { stability: 0.5, similarity_boost: 0.85 }
                    })
                });

                if (voiceResponse.ok) {
                    const arrayBuffer = await voiceResponse.arrayBuffer();
                    audioBase64 = Buffer.from(arrayBuffer).toString('base64');
                }
            } catch (audioErr) {
                console.error("Error de voz:", audioErr);
            }
        }

        return res.status(200).json({ 
            response: responseText,
            audio: audioBase64 
        });

    } catch (error) {
        console.error("Error crítico:", error);
        return res.status(500).json({ error: "Error en el núcleo: " + error.message });
    }
}