import DOMPurify from 'dompurify';

// Tags the product-description rich-text editor can produce (StarterKit + underline).
// Kept deliberately small — no images, scripts, styles, iframes, etc.
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li', 'blockquote', 'h3', 'h4', 'a', 'code', 'pre',
];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Sanitize stored/editor HTML before rendering with `dangerouslySetInnerHTML`.
 * Strips scripts, event handlers and unknown tags → defends against stored XSS
 * (product descriptions are authored by sellers, an untrusted-ish source).
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR });
}

// Shared content styling for the editor surface AND read-only rendering, so what a
// seller types matches the storefront (Tailwind preflight strips list markers).
// Lives here (not in RichTextEditor) so read-only pages don't pull in TipTap.
export const RICH_TEXT_CONTENT_CLASS =
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:underline';
