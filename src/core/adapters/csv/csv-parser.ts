import type { ParsedTransaction } from "../../ports/import-source";

// CSV fallback for the OFX import (escopo §6: "CSV como fallback, ex. fatura do
// cartão"). There is no universal bank-CSV layout, so this parser is tolerant:
// it sniffs the delimiter, finds the date / description / amount columns by their
// header names, and reads Brazilian dates and comma-decimal money. The amount's
// sign is respected as-is (negative = expense), matching OFX semantics.

/** CSVs rarely declare their encoding. Try UTF-8; if that yields replacement
 *  characters (Latin-1 accents read as mojibake), fall back to windows-1252. */
export function decodeCsv(bytes: Uint8Array): string {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  // U+FFFD is the replacement char TextDecoder emits for invalid UTF-8.
  return utf8.includes("�")
    ? new TextDecoder("windows-1252").decode(bytes)
    : utf8;
}

/** Strip accents + lowercase, so "Lançamento" and "lancamento" match. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combining diacritical marks
    .toLowerCase()
    .trim();
}

/** Most frequent of ; \t , in the header line (comma last — it doubles as the
 *  decimal separator, so it only wins when nothing else is present). */
function detectDelimiter(headerLine: string): string {
  let best = ";";
  let bestCount = -1;
  for (const delimiter of [";", "\t", ","]) {
    const count = headerLine.split(delimiter).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = delimiter;
    }
  }
  return best;
}

/** Split one CSV line on the delimiter, honoring "double-quoted" fields and
 *  "" escapes. Embedded newlines are not supported (an accepted limitation). */
function splitLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

function findColumn(
  headers: string[],
  keywords: string[],
  taken: Set<number>,
): number {
  for (let i = 0; i < headers.length; i += 1) {
    if (taken.has(i)) continue;
    if (keywords.some((keyword) => headers[i].includes(keyword))) return i;
  }
  return -1;
}

/** Parse a Brazilian (DD/MM/YYYY, DD/MM/YY) or ISO (YYYY-MM-DD) date at UTC noon,
 *  matching how the rest of the app stores dates (escopo §4). Invalid → null. */
function parseDate(raw: string): Date | null {
  const value = raw.trim();
  let year: number;
  let month: number;
  let day: number;

  const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (br) {
    day = Number(br[1]);
    month = Number(br[2]);
    year = br[3].length === 2 ? 2000 + Number(br[3]) : Number(br[3]);
  } else if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // Reject rollovers like 32/13 — the components must round-trip.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

/**
 * Money to signed cents, aware of the file's locale (derived from its delimiter):
 * a ; or tab file is Brazilian/European (comma decimal, dot thousands); a , file
 * is international (dot decimal, comma thousands). Strips currency symbols; the
 * sign is taken from a leading "-". Returns NaN when there is no number.
 */
function parseAmountCents(raw: string, delimiter: string): number {
  let value = raw.replace(/[^\d.,-]/g, "");
  if (delimiter === ",") {
    value = value.replace(/,/g, ""); // thousands; the dot stays decimal
  } else {
    value = value.replace(/\./g, "").replace(",", "."); // dot thousands; comma decimal
  }
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 100) : NaN;
}

const DATE_KEYS = ["data", "date"];
const AMOUNT_KEYS = ["valor", "amount", "montante", "value", "quantia"];
const DESC_KEYS = [
  "desc",
  "histor",
  "lancamento",
  "memo",
  "estabelec",
  "titulo",
  "title",
  "detalhe",
];

/**
 * Parse a bank/card CSV into neutral transactions. Throws a friendly error when
 * the required columns can't be found. Rows with an unparseable date or amount
 * are skipped (header noise, totals, blank lines).
 */
export function parseCsv(text: string): ParsedTransaction[] {
  const lines = text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter).map(normalize);

  const taken = new Set<number>();
  const dateIdx = findColumn(headers, DATE_KEYS, taken);
  if (dateIdx >= 0) taken.add(dateIdx);
  const amountIdx = findColumn(headers, AMOUNT_KEYS, taken);
  if (amountIdx >= 0) taken.add(amountIdx);
  const descIdx = findColumn(headers, DESC_KEYS, taken);

  if (dateIdx < 0 || amountIdx < 0) {
    throw new Error(
      "CSV não reconhecido: o cabeçalho precisa ter colunas de data e valor.",
    );
  }

  const transactions: ParsedTransaction[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, delimiter);
    const date = parseDate(cells[dateIdx] ?? "");
    if (!date) continue;

    const amountCents = parseAmountCents(cells[amountIdx] ?? "", delimiter);
    if (!Number.isFinite(amountCents) || amountCents === 0) continue;

    const description = descIdx >= 0 ? (cells[descIdx] ?? "").trim() : "";
    transactions.push({ date, amountCents, description, memo: description });
  }
  return transactions;
}
