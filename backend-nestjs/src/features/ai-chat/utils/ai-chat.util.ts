import { Logger } from '@nestjs/common';
import {
  ChatbotConfig,
  ChatCompletionMessage,
  LlmResult,
  ProductContextItem,
} from '../types/ai-chat.types';
import { AgentToolDefinition } from '../tools/agent-tools';

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
- CHỈ gợi ý những sản phẩm xuất hiện trong danh sách "SẢN PHẨM LIÊN QUAN" được cung cấp bên dưới (hoặc trong kết quả tool search_products). TUYỆT ĐỐI KHÔNG bịa ra sản phẩm, giá, hay cửa hàng không có trong danh sách.
- Kho sản phẩm đặt tên bằng TIẾNG VIỆT. Nếu danh sách "SẢN PHẨM LIÊN QUAN" trống, ĐỪNG vội kết luận là không có — trước tiên hãy gọi tool search_products với TỪ KHOÁ TIẾNG VIỆT (dịch nhu cầu của khách sang tiếng Việt, ví dụ "men t-shirt" → "áo thun nam"). Chỉ nói "chưa tìm thấy" sau khi đã thử tìm mà vẫn không có, rồi gợi ý khách thử từ khoá khác.
- NGÔN NGỮ: luôn trả lời khách bằng ĐÚNG ngôn ngữ mà khách đang dùng (khách nhắn tiếng Anh → trả lời tiếng Anh; tiếng Việt → trả lời tiếng Việt). Chỉ dùng tiếng Việt cho TỪ KHOÁ tìm kiếm nội bộ, không phải cho câu trả lời.
- Trả lời ngắn gọn, thân thiện. Không lặp lại nguyên văn danh sách; hãy diễn giải tự nhiên.

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
  'tôi',
  'toi',
  'mình',
  'minh',
  'em',
  'anh',
  'chị',
  'chi',
  'bạn',
  'ban',
  'cần',
  'can',
  'muốn',
  'muon',
  'tìm',
  'tim',
  'mua',
  'kiếm',
  'kiem',
  'xem',
  'cho',
  'với',
  'voi',
  'và',
  'va',
  'có',
  'co',
  'là',
  'la',
  'một',
  'mot',
  'những',
  'nhung',
  'các',
  'cac',
  'cái',
  'cai',
  'chiếc',
  'chiec',
  'loại',
  'loai',
  'sản',
  'san',
  'phẩm',
  'pham',
  'hàng',
  'hang',
  'shop',
  'cửa',
  'cua',
  'giá',
  'gia',
  'rẻ',
  're',
  'đắt',
  'dat',
  'tốt',
  'tot',
  'đẹp',
  'dep',
  'ngon',
  'khoảng',
  'khoang',
  'dưới',
  'duoi',
  'trên',
  'tren',
  'từ',
  'tu',
  'đến',
  'den',
  'tầm',
  'tam',
  'giới',
  'gioi',
  'hạn',
  'han',
  'ạ',
  'a',
  'nhé',
  'nhe',
  'nha',
  'xin',
  'chào',
  'chao',
  'ơi',
  'oi',
  'gì',
  'gi',
  'nào',
  'nao',
  'thế',
  'the',
  'khoảng',
  'độ',
  'do',
  'chất',
  'chat',
  'lượng',
  'luong',
  // Variant-axis labels + follow-up fillers: these are never product nouns, so
  // a message like "size M đi" / "màu đen nha" must not seed random matches.
  'size',
  'màu',
  'mau',
  'kích',
  'kich',
  'thước',
  'thuoc',
  'đi',
  'di',
  'ok',
  'oke',
  'okie',
  'vâng',
  'vang',
  'uh',
  'ừ',
  'u',
  'chọn',
  'chon',
  'lấy',
  'lay',
  'này',
  'nay',
  'đó',
  'thêm',
  'them',
  'giúp',
  'giup',
  'cũng',
  'cung',
  'được',
  'duoc',
  'luôn',
  'luon',
  'rồi',
  'roi',
]);

const PRICE_TOKEN =
  /^\d+(?:[.,]\d+)?(?:k|tr|triệu|trieu|đ|d|vnd|nghìn|nghin|ngàn|ngan)?$/i;

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
    if (unit.includes('tr') || unit.includes('triệu'))
      return Math.round(num * 1_000_000);
    if (unit.includes('k') || unit.includes('ngàn') || unit.includes('nghìn'))
      return Math.round(num * 1_000);
    return Math.round(num);
  };
  const numUnit = '(\\d+(?:[.,]\\d+)?)\\s*(triệu|tr|k|ngàn|nghìn|đ|vnd)?';

  // Range: "200k - 500k"
  const range = text.match(
    new RegExp(`${numUnit}\\s*(?:-|đến|tới)\\s*${numUnit}`),
  );
  if (range) {
    const a = toVnd(range[1], range[2] ?? '');
    const b = toVnd(range[3], range[4] ?? range[2] ?? '');
    return { min_price: Math.min(a, b), max_price: Math.max(a, b) };
  }

  const under = text.match(
    new RegExp(`(?:dưới|<|nhỏ hơn|tối đa|khoảng)\\s*${numUnit}`),
  );
  if (under) return { max_price: toVnd(under[1], under[2] ?? '') };

  const over = text.match(new RegExp(`(?:trên|>|lớn hơn|từ)\\s*${numUnit}`));
  if (over) return { min_price: toVnd(over[1], over[2] ?? '') };

  return {};
}

/**
 * Extra system-prompt guidance for the agent loop: how/when to use tools, and
 * the hard rule that money (checkout) is only ever *proposed*, never claimed as
 * done. Appended after the base prompt + product context.
 */
export const AGENT_SYSTEM_PROMPT_SUFFIX = `

BẠN LÀ TRỢ LÝ MUA HÀNG CÓ CÔNG CỤ (tool). Ngoài tư vấn, bạn có thể GIÚP KHÁCH THAO TÁC bằng cách gọi tool:
- Tìm sản phẩm: search_products (lấy product_variant_id để thêm giỏ).
- Giỏ hàng: view_cart, add_to_cart, update_cart_item, remove_cart_item — cứ thực hiện khi khách yêu cầu.
- Mã giảm giá: list_coupons (xem voucher đang áp dụng được cho giỏ).
- Đơn hàng: list_orders, get_order, cancel_order (chỉ huỷ đơn pending).
- Địa chỉ: list_addresses.
- Đặt hàng: propose_checkout — CHỈ tạo bảng tạm tính để khách xác nhận.
- Hỏi lựa chọn nhanh: ask_choice — hiện các NÚT bấm để khách chọn (màu/size/mã giảm giá) thay vì gõ tay.
- FAQ chính sách: get_policies.

QUY TẮC CHỌN BIẾN THỂ (RẤT QUAN TRỌNG — chống thêm nhầm hàng):
- Mỗi sản phẩm có thể có nhiều biến thể theo 1–2 thuộc tính (ví dụ Màu sắc + Kích thước). Mỗi product_variant_id ứng với MỘT tổ hợp thuộc tính cụ thể.
- Trước khi add_to_cart, khách PHẢI chọn rõ TẤT CẢ các thuộc tính mà sản phẩm có. Nếu khách mới nói một phần (ví dụ chỉ nói size mà chưa nói màu, hoặc ngược lại), hãy HỎI LẠI phần còn thiếu. Khi hỏi, hãy gọi tool ask_choice với danh sách các giá trị CÓ SẴN của thuộc tính còn thiếu (vd các màu: "Màu Đen", "Màu Trắng") để khách BẤM chọn thay vì gõ tay. TUYỆT ĐỐI KHÔNG tự chọn/mặc định giúp một giá trị mà khách chưa nói.
- Chỉ gọi add_to_cart khi đã xác định đúng product_variant_id khớp mọi lựa chọn của khách. Nếu chưa chắc, hỏi lại — đừng đoán.

QUY TẮC KHÁC:
- Ngôn ngữ trả lời phải khớp ngôn ngữ của khách (Anh↔Anh, Việt↔Việt). Kho hàng tên tiếng Việt → khi gọi search_products hãy DỊCH nhu cầu sang từ khoá tiếng Việt (ví dụ "cheap black hoodie" → "áo hoodie đen"). Nếu lần đầu không ra kết quả, thử lại với từ khoá tiếng Việt khác trước khi nói không có.
- Khi khách muốn thêm/mua sản phẩm: dùng search_products để lấy đúng product_variant_id rồi (sau khi đã đủ thuộc tính) add_to_cart.
- Mã giảm giá: khi khách hỏi về mã/voucher/khuyến mãi, gọi list_coupons và nêu các mã đang dùng được. Trước khi khách thanh toán, hãy CHỦ ĐỘNG gọi list_coupons và nhắc nếu có voucher phù hợp để khách đỡ bỏ lỡ. Nếu có nhiều mã dùng được (eligible=true), có thể gọi ask_choice để khách BẤM chọn mã (mỗi option dạng "Dùng mã <CODE>"). Khi khách đồng ý dùng mã, truyền code vào propose_checkout.coupon_codes (tối đa 1 mã sàn + 1 mã mỗi shop).
- Khi khách muốn "đặt hàng / thanh toán": gọi propose_checkout để hiện bảng tạm tính. TUYỆT ĐỐI KHÔNG nói rằng đơn đã được đặt — việc đặt đơn do khách bấm nút xác nhận, không phải bạn.
- Nếu tool trả về needs_login: mời khách đăng nhập, đừng bịa dữ liệu.
- Nếu tool trả về error: giải thích ngắn gọn cho khách, đừng bịa kết quả.
- Sau khi gọi tool, hãy trả lời khách bằng tiếng Việt tự nhiên, ngắn gọn dựa trên kết quả tool.`;

/**
 * Call the OpenRouter chat-completions endpoint. Mirrors
 * `grok-visual-search.util.ts`: native fetch, Bearer auth, `response.ok` guard.
 * When `tools` are supplied the model may return `tool_calls` instead of (or
 * alongside) text; the result carries both so the agent loop can dispatch tools
 * or finish. Throws on transport/API failure so the service can fall back.
 */
export async function callChatCompletion(
  messages: ChatCompletionMessage[],
  config: ChatbotConfig,
  options?: { tools?: AgentToolDefinition[]; model?: string },
): Promise<LlmResult> {
  const body: Record<string, unknown> = {
    model: options?.model ?? config.chatModel,
    messages,
    temperature: 0.4,
    max_tokens: 800,
  };
  if (options?.tools?.length) {
    body.tools = options.tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      `AI chat API error ${response.status}: ${errorText.slice(0, 300)}`,
    );
    throw new Error(`AI chat API returned status ${response.status}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message ?? {};
  const content: string | null =
    typeof message.content === 'string' ? message.content.trim() : null;
  const toolCalls = Array.isArray(message.tool_calls)
    ? message.tool_calls
    : undefined;

  if (
    (!content || content.length === 0) &&
    (!toolCalls || toolCalls.length === 0)
  ) {
    throw new Error('AI chat API returned neither content nor tool calls');
  }
  return {
    content: content && content.length ? content : null,
    tool_calls: toolCalls,
  };
}
