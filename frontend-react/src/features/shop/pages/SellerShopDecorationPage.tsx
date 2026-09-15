import { useState } from 'react';
import { ExternalLink, Loader2, RotateCcw, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '@/common/components/feedback/toast';
import { ROUTES } from '@/common/constants/routes';
import { useMyShop } from '../hooks/useMyShop';
import { useUpdateShopDecoration } from '../hooks/useUpdateShopDecoration';
import {
  decorationConfigSchema,
  parseDecorationConfig,
  type AnyBlock,
  type BlockType,
  type DecorationConfig,
} from '../types/decoration.types';
import {
  createBlock,
  emptyDecorationConfig,
  moveBlock,
} from '../utils/decoration.util';
import { BlockListEditor } from '../components/decoration/builder/BlockListEditor';
import { BlockEditorPanel } from '../components/decoration/builder/BlockEditorPanel';
import { ThemeEditor } from '../components/decoration/builder/ThemeEditor';
import { DecorationPreview } from '../components/decoration/builder/DecorationPreview';

const primaryBtn =
  'inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryBtn =
  'inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800';

export default function SellerShopDecorationPage() {
  const { data: shop, isLoading, isError } = useMyShop();
  const save = useUpdateShopDecoration(shop?.slug);

  const [config, setConfig] = useState<DecorationConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seededSlug, setSeededSlug] = useState<string | null>(null);

  // Seed editor state from the loaded shop once (adjust-state-during-render — the
  // React-endorsed pattern for deriving state from async data without an effect).
  if (shop && seededSlug !== shop.slug) {
    setConfig(parseDecorationConfig(shop.decoration_config) ?? emptyDecorationConfig());
    setSeededSlug(shop.slug);
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading...</div>;
  }

  // No shop yet (GET /seller/shop → SHOP_004) — decoration needs a shop first.
  if (isError || !shop) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Set up your shop before decorating it.
        </p>
        <Link to={ROUTES.SELLER_SHOP} className={`${primaryBtn} mt-4`}>
          Go to Shop Settings
        </Link>
      </div>
    );
  }

  if (!config) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading...</div>;
  }

  const blocks = config.blocks;
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  const setBlocks = (next: AnyBlock[]) => setConfig({ ...config, blocks: next });

  const handleAdd = (type: BlockType) => {
    const block = createBlock(type);
    setBlocks([...blocks, block]);
    setSelectedId(block.id);
  };

  const handleRemove = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleMove = (index: number, direction: -1 | 1) =>
    setBlocks(moveBlock(blocks, index, direction));

  const handleUpdateBlock = (updated: AnyBlock) =>
    setBlocks(blocks.map((b) => (b.id === updated.id ? updated : b)));

  const handleSave = () => {
    const result = decorationConfigSchema.safeParse(config);
    if (!result.success) {
      showErrorToast(
        new Error('Some blocks are incomplete. Check images, text and pinned products.'),
      );
      return;
    }
    save.mutate(result.data as DecorationConfig, {
      onSuccess: () => showSuccessToast('Shop decoration saved'),
      onError: (err) => showErrorToast(err),
    });
  };

  const handleReset = () => {
    const empty = emptyDecorationConfig();
    setConfig(empty);
    setSelectedId(null);
    save.mutate(null, {
      onSuccess: () => showSuccessToast('Reset to the default layout'),
      onError: (err) => showErrorToast(err),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Shop Decoration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Customize your storefront. Blocks show above your product catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shop && (
            <Link
              to={ROUTES.SHOP_PROFILE(shop.slug)}
              target="_blank"
              className={secondaryBtn}
            >
              <ExternalLink className="h-4 w-4" />
              View shop
            </Link>
          )}
          <button type="button" onClick={handleReset} disabled={save.isPending} className={secondaryBtn}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button type="button" onClick={handleSave} disabled={save.isPending} className={primaryBtn}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <BlockListEditor
              blocks={blocks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onMove={handleMove}
            />
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <ThemeEditor
              theme={config.theme}
              onChange={(theme) => setConfig({ ...config, theme })}
            />
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <BlockEditorPanel block={selected} onChange={handleUpdateBlock} />
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <DecorationPreview config={config} />
        </div>
      </div>
    </div>
  );
}
