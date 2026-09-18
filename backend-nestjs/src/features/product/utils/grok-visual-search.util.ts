import { Logger } from '@nestjs/common';

const logger = new Logger('VisualSearch');

export interface VisualSearchAttributes {
  category: string;
  color: string;
  material: string;
  style: string;
  keywords: string[];
}

const SYSTEM_PROMPT = `You are a product image analysis assistant for a **Vietnamese** e-commerce platform.
The product catalog (category names, product names, descriptions, colours) is written in **Vietnamese**,
so your output is used to search Vietnamese text and MUST be in Vietnamese.
Analyze the product image and extract structured attributes.
Return ONLY a valid JSON object with these fields:
- "category": the product category in Vietnamese (e.g. "Áo thun", "Giày sneaker", "Laptop", "Sổ tay")
- "color": the dominant colour(s) in Vietnamese (e.g. "Đen", "Trắng", "Nâu"). If several, pick the single most dominant colour word; do NOT answer "nhiều màu"/"multi-color"
- "material": the material in Vietnamese if identifiable (e.g. "Cotton", "Da", "Nhựa"), or empty string
- "style": style descriptor in Vietnamese (e.g. "Casual", "Công sở", "Thể thao"), or empty string
- "keywords": array of 4-6 search keywords. Include the plain Vietnamese product-type noun (e.g. "sổ tay", "áo thun", "giày sneaker") AND, if any brand/model text is visible on the product (e.g. "iPhone", "MacBook", "Samsung"), include it verbatim in its original spelling

"category", "color", "material", "style" MUST be in Vietnamese. "keywords" are mostly Vietnamese but may keep brand/model names in their original language.

Example response:
{"category":"Áo thun","color":"Đen","material":"Cotton","style":"Casual","keywords":["áo thun nam","tay ngắn","cổ tròn","basic"]}`;

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
            {
              type: 'text',
              text: 'Analyze this product image and return the JSON attributes.',
            },
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
    logger.warn(
      `Failed to parse visual search response: ${content.slice(0, 200)}`,
    );
    return defaults;
  }
}
