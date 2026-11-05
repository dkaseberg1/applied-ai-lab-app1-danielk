import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI with required telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface CalculatedPayload {
  mostChangedRegion: {
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    dollarChange: number;
    percentChange: number;
    direction: 'increase' | 'decrease';
    q2Units: number;
    q3Units: number;
    unitsChange: number;
    q2AvgDiscountPct: number;
    q3AvgDiscountPct: number;
    topProductDriver: {
      product: string;
      q2Revenue: number;
      q3Revenue: number;
      revenueChange: number;
      q2Units: number;
      q3Units: number;
      unitsChange: number;
    } | null;
    topChannelDriver: {
      channel: string;
      q2Revenue: number;
      q3Revenue: number;
      revenueChange: number;
    } | null;
  };
  otherRegions: Array<{
    region: string;
    q2Revenue: number;
    q3Revenue: number;
    dollarChange: number;
    percentChange: number;
  }>;
  totalQ2Revenue: number;
  totalQ3Revenue: number;
  totalRevenueChange: number;
}

// Helper to count sentences reliably
function countSentences(text: string): number {
  if (!text.trim()) return 0;
  // Match sentence endings like '.', '!', '?' not immediately followed by letters/digits (to avoid decimal numbers like $1.4M or Q2.5)
  const sentences = text
    .replace(/([0-9]+)\.([0-9]+)/g, '$1_$2') // preserve decimal numbers
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
  return sentences.length;
}

app.post('/api/ai-summary', async (req, res) => {
  try {
    const data: CalculatedPayload = req.body;

    if (!data || !data.mostChangedRegion) {
      return res.status(400).json({ error: 'Missing calculated region metrics in request body' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found in environment');
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the environment.',
      });
    }

    const { mostChangedRegion, otherRegions } = data;

    // Format numbers nicely in prompt for ground truth references
    const fmtUSD = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    const fmtPct = (n: number) => `${Math.abs(n).toFixed(1)}%`;

    const prompt = `You are a senior financial analyst writing an executive quarterly commentary.
Based STRICTLY and EXCLUSIVELY on the calculated figures below, write a THREE-SENTENCE summary of which region changed the most in total revenue from Q2 to Q3, and why.

CRITICAL RULES:
1. OUTPUT MUST BE EXACTLY THREE SENTENCES. Count your sentences before outputting. Do not write 2 sentences. Do not write 4 sentences.
2. SENTENCE 1: State clearly which region changed most from Q2 to Q3, and report its exact Q2 revenue, Q3 revenue, dollar change, and percentage change.
3. SENTENCE 2: Explain the primary product driver for this shift, citing the product name, its Q2 revenue, Q3 revenue, dollar change, and/or units change.
4. SENTENCE 3: Complete the explanation by citing the primary channel driver or unit/discount shift that accounts for the regional variance, using the provided calculated figures.
5. GROUND TRUTH ENFORCEMENT: You must ONLY use numbers provided in the DATA BLOCK below. NEVER invent, round differently, estimate, or extrapolate outside numbers or business reasons not given.
6. Do NOT use bullet points, bold headers, quotation marks, or conversational intro ("Here is the summary:"). Write only three continuous, professional sentences.

DATA BLOCK (APP CALCULATED VALUES):
- Primary Region with Largest Q2 to Q3 Shift: "${mostChangedRegion.region}"
- Direction of Change: ${mostChangedRegion.direction === 'increase' ? 'Revenue grew / increased' : 'Revenue declined / dropped'}
- Region Q2 Revenue: ${fmtUSD(mostChangedRegion.q2Revenue)} (${mostChangedRegion.q2Revenue.toFixed(2)})
- Region Q3 Revenue: ${fmtUSD(mostChangedRegion.q3Revenue)} (${mostChangedRegion.q3Revenue.toFixed(2)})
- Region Net Dollar Change: ${mostChangedRegion.dollarChange >= 0 ? '+' : '-'}${fmtUSD(mostChangedRegion.dollarChange)} (${mostChangedRegion.dollarChange.toFixed(2)})
- Region Percentage Change: ${mostChangedRegion.percentChange >= 0 ? '+' : '-'}${fmtPct(mostChangedRegion.percentChange)} (${mostChangedRegion.percentChange.toFixed(2)}%)
- Region Q2 Units: ${mostChangedRegion.q2Units.toLocaleString()} units
- Region Q3 Units: ${mostChangedRegion.q3Units.toLocaleString()} units
- Region Units Change: ${mostChangedRegion.unitsChange >= 0 ? '+' : ''}${mostChangedRegion.unitsChange.toLocaleString()} units
- Region Q2 Average Discount: ${mostChangedRegion.q2AvgDiscountPct.toFixed(1)}%
- Region Q3 Average Discount: ${mostChangedRegion.q3AvgDiscountPct.toFixed(1)}%
${
  mostChangedRegion.topProductDriver
    ? `- Top Product Driver: "${mostChangedRegion.topProductDriver.product}" (Q2 Revenue: ${fmtUSD(mostChangedRegion.topProductDriver.q2Revenue)}, Q3 Revenue: ${fmtUSD(mostChangedRegion.topProductDriver.q3Revenue)}, Revenue Change: ${mostChangedRegion.topProductDriver.revenueChange >= 0 ? '+' : '-'}${fmtUSD(mostChangedRegion.topProductDriver.revenueChange)}, Q2 Units: ${mostChangedRegion.topProductDriver.q2Units.toLocaleString()}, Q3 Units: ${mostChangedRegion.topProductDriver.q3Units.toLocaleString()}, Units Change: ${mostChangedRegion.topProductDriver.unitsChange >= 0 ? '+' : ''}${mostChangedRegion.topProductDriver.unitsChange.toLocaleString()})`
    : ''
}
${
  mostChangedRegion.topChannelDriver
    ? `- Top Channel Driver: "${mostChangedRegion.topChannelDriver.channel}" (Q2 Revenue: ${fmtUSD(mostChangedRegion.topChannelDriver.q2Revenue)}, Q3 Revenue: ${fmtUSD(mostChangedRegion.topChannelDriver.q3Revenue)}, Revenue Change: ${mostChangedRegion.topChannelDriver.revenueChange >= 0 ? '+' : '-'}${fmtUSD(mostChangedRegion.topChannelDriver.revenueChange)})`
    : ''
}
- Other Regions for Context:
${otherRegions.map(r => `  * ${r.region}: Q2 ${fmtUSD(r.q2Revenue)} -> Q3 ${fmtUSD(r.q3Revenue)} (${r.dollarChange >= 0 ? '+' : '-'}${fmtUSD(r.dollarChange)}, ${r.percentChange >= 0 ? '+' : '-'}${fmtPct(r.percentChange)})`).join('\n')}
`;

    let summary = '';
    let lastError: any = null;

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a meticulous executive financial analyst. You write exactly three concise, objective sentences explaining quarterly regional variance using only verified dataset calculations.',
          },
        });
        summary = response.text ? response.text.trim() : '';
        if (summary) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini API attempt ${attempt} failed:`, err.message || err);
        if (attempt < 3) {
          // Wait 1s, then 2s
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    if (!summary) {
      console.warn('All Gemini attempts failed, constructing deterministic three-sentence fallback');
      // Deterministic ground truth 3-sentence summary based on the exact calculated numbers
      const dirWord = mostChangedRegion.direction === 'increase' ? 'surged' : 'contracted';
      const changeSign = mostChangedRegion.dollarChange >= 0 ? '+' : '';
      const s1 = `The ${mostChangedRegion.region} region recorded the largest change from Q2 to Q3, as total revenue ${dirWord} from ${fmtUSD(mostChangedRegion.q2Revenue)} to ${fmtUSD(mostChangedRegion.q3Revenue)}, reflecting a net variance of ${changeSign}${fmtUSD(mostChangedRegion.dollarChange)} (${changeSign}${fmtPct(mostChangedRegion.percentChange)}).`;

      const prod = mostChangedRegion.topProductDriver;
      const s2 = prod
        ? `This shift was primarily driven by ${prod.product}, where revenue moved from ${fmtUSD(prod.q2Revenue)} to ${fmtUSD(prod.q3Revenue)} (a change of ${prod.revenueChange >= 0 ? '+' : '-'}${fmtUSD(prod.revenueChange)}) on volume moving from ${prod.q2Units.toLocaleString()} to ${prod.q3Units.toLocaleString()} units.`
        : `Overall volume shifted by ${Math.abs(mostChangedRegion.unitsChange).toLocaleString()} units while regional average discounting adjusted from ${mostChangedRegion.q2AvgDiscountPct.toFixed(1)}% to ${mostChangedRegion.q3AvgDiscountPct.toFixed(1)}%.`;

      const chan = mostChangedRegion.topChannelDriver;
      const s3 = chan
        ? `In addition, the ${chan.channel} channel accounted for a variance of ${chan.revenueChange >= 0 ? '+' : '-'}${fmtUSD(chan.revenueChange)}, while average regional discounts moved from ${mostChangedRegion.q2AvgDiscountPct.toFixed(1)}% to ${mostChangedRegion.q3AvgDiscountPct.toFixed(1)}%.`
        : `Across the entire year, the ${mostChangedRegion.region} sales territory generated substantial overall revenue.`;

      summary = `${s1} ${s2} ${s3}`;
    }

    const sentences = countSentences(summary);

    return res.json({
      summary,
      sentenceCount: sentences,
      model: lastError && !summary ? 'fallback-ground-truth' : 'gemini-3.8-flash',
      calculatedRegion: mostChangedRegion.region,
    });
  } catch (err: any) {
    console.error('Gemini API Error in /api/ai-summary:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred while generating the regional summary.',
    });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SalesPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
