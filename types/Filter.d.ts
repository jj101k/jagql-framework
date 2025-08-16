/**
 *
 */
export type FilterSpec = { operator: "<" | ">" | "~" | ":"; value: string}  | { operator: null; value: string}

/**
 * Each key must be a defined resource attribute; and must not be a
 * "foreign reference".
 *
 * @see FilterSpecIn
 */
export interface FilterSpecByAttrIn {
  [k: string]: FilterSpecIn
}

/**
 * Classic form: a string[*]. This includes the ID for relationships.
 * Comma form: Classic form, but comma-separated
 * Array form: An array of classic form values
 * Recursive form: field name (relation) mapped to a filter applicable to
 * that relation[**]
 *
 * * Values may start with "<" (less-than), ">" (greater-than), ":" (contains,
 * case-insensitive) or "~" (equal, case-insensitive), or no prefix (equal).
 * ** Semantically, this will filter _the relation_. It will not filter the
 * top-level item(s). Handlers may of course filter as they please.
 */
export type FilterSpecIn = string | string[] | FilterSpecByAttrIn