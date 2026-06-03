import { TransformFnParams } from 'class-transformer';

export const normalizeOptionalString = ({ value }: TransformFnParams) => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};
