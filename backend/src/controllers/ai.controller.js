import Doctor, { VALID_SPECIALTIES } from '../models/Doctor.js';

const SYSTEM_PROMPT_TEMPLATE = (language) => `
You are SehatSetu AI Care Guide, a clinical triage navigation assistant serving the community of Indore, Madhya Pradesh, India.
Your role is to analyze patient symptoms described in natural English, Hindi (Devanagari script), or Hinglish (Hindi written using English letters, e.g. "mere sir me bahut dard hai 2 din se").

CRITICAL SAFETY & TRIAGE RULES:
1. EMERGENCY TRIAGE:
   Immediately evaluate for emergency red-flag conditions:
   - Crushing chest pain, pressure or squeezing radiating to left arm, neck, jaw, or upper back
   - Acute severe breathlessness, choking, gasping for air, or severe respiratory distress
   - Stroke symptoms (FAST: facial drooping, arm weakness, slurred speech, acute confusion)
   - Sudden thunderclap headache, sudden loss of vision, acute loss of consciousness, fainting, or collapse
   - Uncontrollable severe bleeding, major trauma, acute poisoning, severe allergic anaphylaxis
   If ANY emergency red flag is present:
   - Set "isEmergency": true
   - "emergencyGuidance": Provide immediate, urgent guidance to call 112 / 108 or proceed to the nearest emergency hospital/trauma center in Indore without delay.
   - DO NOT ask follow-up questions when an emergency is detected.

2. NO MEDICAL DIAGNOSIS OR PRESCRIPTIONS:
   Never diagnose diseases, never prescribe medications, never claim certainty. You provide healthcare navigation and specialist recommendations only.

3. SPECIALIST RECOMMENDATIONS:
   If not an emergency:
   - If key details are missing (e.g., user just said "dard hai" or "I am sick"), ask 1 concise follow-up question regarding location, duration, or associated symptoms.
   - If sufficient symptoms are described, recommend the single most suitable doctor category strictly from this list:
     ${JSON.stringify(VALID_SPECIALTIES)}
   - Mapping guidelines:
     - Heart issues, chest discomfort (non-emergency), palpitations -> "Cardiology"
     - Bones, joints, back, fractures, knee/shoulder pain -> "Orthopedics"
     - Children & infants (under 16) -> "Pediatrics"
     - Skin rashes, acne, itching, eczema, hair/scalp problems -> "Dermatology"
     - Fever, cough, cold, flu, stomach upset, routine fatigue, general illness -> "General Medicine"
     - Pregnancy, menstrual issues, female reproductive health -> "Gynecology"
     - Persistent headaches, migraines, numbness, seizures, tremors -> "Neurology"
     - Earache, sore throat, hearing loss, sinus, nasal blockage -> "ENT Specialist"
     - Other uncategorized issues -> "Other"
   - "recommendedCategory" MUST match one of the exact strings above, or null if follow-up is needed.

4. LANGUAGE OF RESPONSE:
   Selected language: ${language === 'hi' ? 'Hindi (हिन्दी / Devanagari script)' : 'English'}.
   - If Hindi, write entirely in natural, respectful Hindi using Devanagari script (e.g., "नमस्ते! आपके लक्षणों के आधार पर...").
   - If English, write entirely in natural, empathetic English.
   - Do not mix languages unnecessarily.

5. OUTPUT FORMAT:
   Respond ONLY with a valid JSON object matching this schema:
   {
     "isEmergency": boolean,
     "emergencyGuidance": string or null,
     "reply": string,
     "recommendedCategory": string or null,
     "explanation": string or null,
     "followUpQuestion": string or null,
     "disclaimer": string
   }
`;

async function callGemini(systemPrompt, conversationText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const configuredModel = process.env.GEMINI_MODEL;
  const models = [
    ...(configuredModel ? [configuredModel] : []),
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
  ];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\nPatient conversation transcript:\n${conversationText}\n\nProvide your clinical triage response strictly as JSON.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini ${model} failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');

      return JSON.parse(rawText);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

async function callOpenAI(systemPrompt, messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const url = 'https://api.openai.com/v1/chat/completions';
  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    })),
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response from OpenAI');

  return JSON.parse(rawText);
}

export const triageSymptoms = async (req, res, next) => {
  try {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

    if (!hasGemini && !hasOpenAI) {
      return res.status(503).json({
        status: 'error',
        code: 'AI_NOT_CONFIGURED',
        message:
          'AI service is not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY in backend/.env to enable SehatSetu AI Care Guide.',
        messageHi:
          'एआई सेवा कॉन्फ़िगर नहीं है। कृपया सेहतसेतु एआई केयर गाइड सक्षम करने के लिए backend/.env में GEMINI_API_KEY या OPENAI_API_KEY जोड़ें।',
      });
    }

    const { messages = [], language = 'en' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'A valid non-empty array of messages is required.',
      });
    }

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(language);
    const conversationText = messages
      .map((m) => `${m.role === 'assistant' ? 'AI Guide' : 'Patient'}: ${m.content}`)
      .join('\n');

    let triageResult = null;

    if (hasGemini) {
      triageResult = await callGemini(systemPrompt, conversationText);
    } else {
      triageResult = await callOpenAI(systemPrompt, messages);
    }

    // Validate and clean triageResult
    let recommendedCategory = triageResult.recommendedCategory;
    if (recommendedCategory && !VALID_SPECIALTIES.includes(recommendedCategory)) {
      // Find case-insensitive match
      const matched = VALID_SPECIALTIES.find(
        (s) => s.toLowerCase() === recommendedCategory.toLowerCase()
      );
      recommendedCategory = matched || 'General Medicine';
    }

    // Query live MongoDB for matching doctors if a category is recommended
    let matchingDoctors = [];
    if (recommendedCategory && recommendedCategory !== 'Other') {
      try {
        matchingDoctors = await Doctor.find({
          specialty: new RegExp(`^${recommendedCategory}$`, 'i'),
        })
          .populate('hospital', 'name locality address contactPhone emergencyPhone')
          .sort({ isVerified: -1, experienceYears: -1 })
          .limit(3)
          .lean();
      } catch (dbErr) {
        console.warn('Could not query matching doctors from MongoDB:', dbErr.message);
      }
    }

    return res.status(200).json({
      status: 'success',
      data: {
        reply: triageResult.reply || '',
        isEmergency: Boolean(triageResult.isEmergency),
        emergencyGuidance: triageResult.emergencyGuidance || null,
        recommendedCategory: recommendedCategory || null,
        explanation: triageResult.explanation || null,
        followUpQuestion: triageResult.followUpQuestion || null,
        disclaimer:
          triageResult.disclaimer ||
          (language === 'hi'
            ? 'केवल स्वास्थ्य सेवा मार्गदर्शन। यह चिकित्सा निदान या उपचार नहीं है।'
            : 'Healthcare navigation only. Not a medical diagnosis or prescription.'),
        matchingDoctors,
      },
    });
  } catch (error) {
    next(error);
  }
};
