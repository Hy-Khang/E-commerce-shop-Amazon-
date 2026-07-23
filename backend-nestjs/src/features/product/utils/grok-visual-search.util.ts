import { Logger } from '@nestjs/common';

const logger = new Logger('VisualSearch');

export interface VisualSearchAttributes {
  category: string;
  color: string;
  material: string;
  style: string;
  keywords: string[];
}

const SYSTEM_PROMPT = `You are a product image analysis assistant for an e-commerce platform.
Analyze the product image and extract structured attributes.
Return ONLY a valid JSON object with these fields:
- "category": the product category (e.g. "T-shirt", "Sneakers", "Laptop", "Backpack")
- "color": the dominant color(s) (e.g. "Black", "Red and White")
- "material": the material if identifiable (e.g. "Cotton", "Leather", "Plastic"), or empty string
- "style": style descriptor (e.g. "Casual", "Formal", "Sport"), or empty string
- "keywords": array of 3-5 search keywords describing the product

Example response:
{"category":"T-shirt","color":"Black","material":"Cotton","style":"Casual","keywords":["men","short sleeve","crew neck","basic"]}`;

export async function analyzeProductImage(
  imageBuffer: Buffer,
  mimeType: string,
  config: { apiKey: string; baseUrl: string; model: string },
): Promise<VisualSearchAttributes> {
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: 'Analyze this product image and return the JSON attributes.' },
          ],
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`Visual search API error ${response.status}: ${errorText}`);
    throw new Error(`Visual search API returned status ${response.status}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';

  return parseAttributes(content);
}

function parseAttributes(content: string): VisualSearchAttributes {
  const defaults: VisualSearchAttributes = {
    category: '',
    color: '',
    material: '',
    style: '',
    keywords: [],
  };

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return defaults;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      category: typeof parsed.category === 'string' ? parsed.category : '',
      color: typeof parsed.color === 'string' ? parsed.color : '',
      material: typeof parsed.material === 'string' ? parsed.material : '',
      style: typeof parsed.style === 'string' ? parsed.style : '',
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.filter((k: unknown) => typeof k === 'string')
        : [],
    };
  } catch {
    logger.warn(`Failed to parse visual search response: ${content.slice(0, 200)}`);
    return defaults;
  }
}
