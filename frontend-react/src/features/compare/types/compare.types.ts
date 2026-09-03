/** One product selected for comparison. `category_id` locks the comparison set. */
export interface CompareEntry {
  product_id: number;
  category_id: number;
}

/** Why an add was rejected — drives the toast message in CompareToggleButton. */
export type CompareAddResult = 'added' | 'full' | 'different_category';
