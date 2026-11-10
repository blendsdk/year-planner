/**
 * Compares two values structurally.
 *
 * Plain objects are compared by key sets, so key insertion order does not
 * matter. Arrays are ordered. Primitives use `Object.is`, so `NaN` equals
 * `NaN`. Non-plain objects (`Date`, `Map`, `Set`, class instances) are compared
 * by identity; metadata should therefore use plain JSON-compatible data when
 * structural equality is expected.
 *
 * @param left - First value.
 * @param right - Second value.
 * @returns `true` when both values are structurally equal.
 *
 * @example
 * ```ts
 * structuralEqual({ a: 1, b: [2] }, { b: [2], a: 1 }); // true
 * ```
 */
export function structuralEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;
    return left.every((value, index) => structuralEqual(value, right[index]));
  }
  if (!isPlainObject(left) || !isPlainObject(right)) return false;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => structuralEqual(left[key], right[key]));
}

/** Returns whether a value is a plain object. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
