import { Logger } from '@nestjs/common';
import {
  ChatbotConfig,
  ChatCompletionMessage,
  ProductContextItem,
} from '../types/ai-chat.types';

const logger = new Logger('AiChat');

/**
 * Default system prompt: describes the marketplace + policies (returns,
 * shipping, payment, coupons/Xu) and constrains the model to only recommend
 * products present in the retrieved context (no hallucinated products).
 */
export const DEFAULT_SYSTEM_PROMPT = `Bạn là trợ lý mua sắm AI của một sàn thương mại điện tử tiếng Việt (giống Shopee/Lazada).
Nhiệm vụ của bạn:
1. Gợi ý sản phẩm phù hợp dựa trên nhu cầu khách mô tả bằng ngôn ngữ tự nhiên.
2. Trả lời câu hỏi thường gặp (FAQ) về chính sách của sàn.
3. Tóm tắt / so sánh nhanh các sản phẩm khi được hỏi.

QUY TẮC BẮT BUỘC:
- CHỈ gợi ý những sản phẩm xuất hiện trong danh sách "SẢN PHẨM LIÊN QUAN" được cung cấp bên dưới. TUYỆT ĐỐI KHÔNG bịa ra sản phẩm, giá, hay cửa hàng không có trong danh sách.
- Nếu không có sản phẩm nào phù hợp trong danh sách, hãy nói thật rằng hiện chưa tìm thấy và gợi ý khách thử từ khóa khác.
- Trả lời ngắn gọn, thân thiện, bằng tiếng Việt. Không lặp lại nguyên văn danh sách; hãy diễn giải tự nhiên.

CHÍNH SÁCH SÀN (dùng để trả lời FAQ):
- Đổi trả: khách có thể yêu cầu trả hàng/hoàn tiền trong vòng 7 ngày kể từ khi nhận hàng (đơn ở trạng thái đã giao).
- Vận chuyển: đơn được giao bởi shipper của sàn; khách theo dõi trạng thái đơn trong mục "Đơn hàng của tôi".
- Thanh toán: hỗ trợ COD (thanh toán khi nhận hàng), VNPay và MoMo.
- Mã giảm giá: có mã toàn sàn và mã của từng shop; áp dụng khi thanh toán. Có thể dùng 1 mã sàn + 1 mã mỗi shop.
- Hoàn Xu: khách tích Xu khi đơn hoàn thành và dùng Xu để giảm giá ở lần mua sau (1 Xu = 1 ₫).`;

/**
 * Render the retrieved products into a compact context block appended to the
 * system prompt. Empty list → an explicit "no products" marker so the model
 * knows not to invent any.
 */
export function buildProductContext(products: ProductContextItem[]): string {
  if (products.length === 0) {
    return '\n\nSẢN PHẨM LIÊN QUAN: (không tìm thấy sản phẩm nào phù hợp trong kho)';
  }

  const lines = products.map((p) => {
    const price =
      p.price_from === p.price_to
        ? `${p.price_from.toLocaleString('vi-VN')}₫`
        : `${p.price_from.toLocaleString('vi-VN')}₫ - ${p.price_to.toLocaleString('vi-VN')}₫`;
    const meta = [p.category, p.shop].filter(Boolean).join(' · ');
    return `- [#${p.id}] ${p.name} — ${price}${meta ? ` (${meta})` : ''}`;
  });

  return `\n\nSẢN PHẨM LIÊN QUAN (chỉ gợi ý trong danh sách này):\n${lines.join('\n')}`;
}

/**
 * Vietnamese filler / stop words + price tokens that must NOT be used as product
 * search terms. The product repo matches `search` as a single `LIKE %term%`
 * (no per-word split), so a whole sentence never matches — we reduce the message
 * to the few meaningful keywords instead.
 */
const STOP_WORDS = new Set([
  'tôi', 'toi', 'mình', 'minh', 'em', 'anh', 'chị', 'chi', 'bạn', 'ban',
  'cần', 'can', 'muốn', 'muon', 'tìm', 'tim', 'mua', 'kiếm', 'kiem', 'xem',
  'cho', 'với', 'voi', 'và', 'va', 'có', 'co', 'là', 'la', 'một', 'mot',
  'những', 'nhung', 'các', 'cac', 'cái', 'cai', 'chiếc', 'chiec', 'loại', 'loai',
  'sản', 'san', 'phẩm', 'pham', 'hàng', 'hang', 'shop', 'cửa', 'cua',
  'giá', 'gia', 'rẻ', 're', 'đắt', 'dat', 'tốt', 'tot', 'đẹp', 'dep', 'ngon',
  'khoảng', 'khoang', 'dưới', 'duoi', 'trên', 'tren', 'từ', 'tu', 'đến', 'den',
  'tầm', 'tam', 'giới', 'gioi', 'hạn', 'han', 'ạ', 'a', 'nhé', 'nhe', 'nha',
  'xin', 'chào', 'chao', 'ơi', 'oi', 'gì', 'gi', 'nào', 'nao', 'thế', 'the',
  'khoảng', 'độ', 'do', 'chất', 'chat', 'lượng', 'luong',
]);

const PRICE_TOKEN = /^\d+(?:[.,]\d+)?(?:k|tr|triệu|trieu|đ|d|vnd|nghìn|nghin|ngàn|ngan)?$/i;

/**
 * Reduce a natural-language message to a few meaningful search keywords: strip
 * punctuation, stop words, price phrases, and very short tokens. Keeps original
 * order and de-duplicates. Empty result → the caller falls back to the raw text.
 */
export function extractKeywords(message: string, max = 4): string[] {
  const tokens = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const kept: string[] = [];
  for (const t of tokens) {
    if (t.length < 2) continue;
    if (STOP_WORDS.has(t)) continue;
    if (PRICE_TOKEN.test(t)) continue;
    if (!kept.includes(t)) kept.push(t);
    if (kept.length >= max) break;
  }
  return kept;
}

/**
 * Best-effort price-hint parser: pulls a max/min price from Vietnamese phrasing
 * like "dưới 300k", "trên 200k", "200k-500k", "khoảng 1 triệu". Returns partial
 * bounds; the caller feeds them into the product query as extra filters.
 */
export function parsePriceHint(message: string): {
  min_price?: number;
  max_price?: number;
} {
  const text = message.toLowerCase();
  const toVnd = (numRaw: string, unit: string): number => {
    const num = parseFloat(numRaw.replace(',', '.'));
    if (unit.includes('tr') || unit.includes('triệu')) return Math.round(num * 1_000_000);
    if (unit.includes('k') || unit.includes('ngàn') || unit.includes('nghìn'))
      return Math.round(num * 1_000);
    return Math.round(num);
  };
  const numUnit = '(\\d+(?:[.,]\\d+)?)\\s*(triệu|tr|k|ngàn|nghìn|đ|vnd)?';

  // Range: "200k - 500k"
  const range = text.match(new RegExp(`${numUnit}\\s*(?:-|đến|tới)\\s*${numUnit}`));
  if (range) {
    const a = toVnd(range[1], range[2] ?? '');
    const b = toVnd(range[3], range[4] ?? range[2] ?? '');
    return { min_price: Math.min(a, b), max_price: Math.max(a, b) };
  }

  const under = text.match(new RegExp(`(?:dưới|<|nhỏ hơn|tối đa|khoảng)\\s*${numUnit}`));
  if (under) return { max_price: toVnd(under[1], under[2] ?? '') };

  const over = text.match(new RegExp(`(?:trên|>|lớn hơn|từ)\\s*${numUnit}`));
  if (over) return { min_price: toVnd(over[1], over[2] ?? '') };

  return {};
}

/**
 * Call the OpenRouter chat-completions endpoint (text only). Mirrors
 * `grok-visual-search.util.ts`: native fetch, Bearer auth, `response.ok` guard.
 * Throws on failure so the service can fall back to a graceful message.
 */
export async function callChatCompletion(
  messages: ChatCompletionMessage[],
  config: ChatbotConfig,
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.chatModel,
      messages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`AI chat API error ${response.status}: ${errorText.slice(0, 300)}`);
    throw new Error(`AI chat API returned status ${response.status}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  if (!content.trim()) {
    throw new Error('AI chat API returned empty content');
  }
  return content.trim();
}
