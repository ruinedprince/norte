import type { AccountType } from "../../domain/transaction";
import type {
  ParsedAccount,
  ParsedStatement,
  ParsedTransaction,
} from "../../ports/import-source";

// OFX comes in two shapes that share the same tag vocabulary:
//   1.x → SGML, leaf tags are NOT closed (<TRNAMT>-50.00 ... newline)
//   2.x → XML,  leaf tags ARE closed  (<TRNAMT>-50.00</TRNAMT>)
// The parser below is tolerant of both: a leaf value is the text after <TAG>
// up to the next "<" (or end of line), which is correct for either shape.

// ---- Encoding (escopo §6: handle Latin-1 / Windows-1252) --------------------

/**
 * Pick a TextDecoder label from the OFX header. 1.x declares it in the plain
 * SGML header (ENCODING:USASCII + CHARSET:1252, or ENCODING:UTF-8); 2.x declares
 * it in the `<?xml encoding="...">` PI. We default to windows-1252, which also
 * decodes plain Latin-1 and USASCII without loss.
 */
export function sniffEncoding(bytes: Uint8Array): string {
  const head = new TextDecoder("windows-1252")
    .decode(bytes.slice(0, 512))
    .toUpperCase();

  if (head.includes("<?XML")) {
    const enc = head.match(/ENCODING="?([\w-]+)"?/)?.[1] ?? "UTF-8";
    return normalizeLabel(enc);
  }

  const encoding = head.match(/ENCODING:\s*([\w-]+)/)?.[1] ?? "";
  const charset = head.match(/CHARSET:\s*([\w-]+)/)?.[1] ?? "";
  return normalizeLabel(`${encoding} ${charset}`);
}

function normalizeLabel(raw: string): string {
  const s = raw.toUpperCase();
  if (/UTF-?8/.test(s)) return "utf-8";
  // 1252, 8859-1, latin1 and USASCII all decode safely under windows-1252.
  return "windows-1252";
}

export function decodeOfx(bytes: Uint8Array): string {
  try {
    return new TextDecoder(sniffEncoding(bytes)).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

// ---- Leaf field extraction --------------------------------------------------

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decodeEntities(s: string): string {
  return s.replace(/&(?:amp|lt|gt|quot|apos);/g, (m) => ENTITIES[m] ?? m);
}

/**
 * Read a leaf field value within `block`. Works for both OFX shapes because the
 * value is captured up to the next "<" or line break. Case-insensitive; returns
 * undefined when the tag is absent or its value is empty.
 */
function field(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, "i"));
  if (!m) return undefined;
  const value = decodeEntities(m[1]).trim();
  return value.length ? value : undefined;
}

/** Extract the inner text of an aggregate `<TAG>...</TAG>` (aggregates are always
 *  closed in both 1.x and 2.x). Falls back to the rest of the text if unclosed. */
function aggregate(text: string, tag: string): string | undefined {
  const open = text.search(new RegExp(`<${tag}>`, "i"));
  if (open < 0) return undefined;
  const after = text.slice(open + tag.length + 2);
  const close = after.search(new RegExp(`</${tag}>`, "i"));
  return close < 0 ? after : after.slice(0, close);
}

// ---- Money & dates ----------------------------------------------------------

/**
 * Parse an OFX decimal amount (e.g. "-50.00") into signed integer cents using
 * integer string math, so no float rounding can creep into the money path.
 * Fractions beyond 2 digits are truncated (OFX BRL amounts carry exactly 2).
 */
export function parseAmountToCents(raw: string): number {
  let s = raw.trim().replace(/\s+/g, "");
  const negative = s.startsWith("-");
  s = s.replace(/^[+-]/, "").replace(",", "."); // tolerate a comma decimal
  const [intPart, fracPart = ""] = s.split(".");
  const frac = `${fracPart}00`.slice(0, 2);
  const cents = Number(intPart || "0") * 100 + Number(frac);
  return negative ? -cents : cents;
}

/**
 * Parse an OFX date (YYYYMMDD[HHMMSS][.ms][tz]) to a Date at UTC noon of that
 * calendar day. Noon UTC keeps the rendered day stable across any timezone
 * within ±12h, avoiding off-by-one display in Brazil (UTC-3).
 */
export function parseOfxDate(raw: string): Date {
  const digits = raw.trim().replace(/\D/g, "");
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// ---- Statement parsing ------------------------------------------------------

export function parseOfx(text: string): ParsedStatement {
  const start = text.search(/<OFX>/i);
  const body = start >= 0 ? text.slice(start) : text;
  return {
    account: parseAccount(body),
    transactions: parseTransactions(body),
  };
}

function parseAccount(body: string): ParsedAccount {
  const currency = field(body, "CURDEF") ?? "BRL";
  const org = field(body, "ORG");

  const bank = aggregate(body, "BANKACCTFROM");
  if (bank) {
    const bankId = field(bank, "BANKID") ?? "";
    const acctId = field(bank, "ACCTID") ?? "unknown";
    return {
      externalId: `${bankId}:${acctId}`,
      type: mapAccountType(field(bank, "ACCTTYPE")),
      currency,
      name: accountName(org, acctId),
    };
  }

  const card = aggregate(body, "CCACCTFROM");
  if (card) {
    const acctId = field(card, "ACCTID") ?? "unknown";
    return {
      // escopo's Account enum has no "credit" type yet; treat a card statement
      // as a checking-like account for now and revisit when CSV card bills land.
      externalId: `cc:${acctId}`,
      type: "checking",
      currency,
      name: accountName(org, acctId),
    };
  }

  return {
    externalId: "unknown",
    type: "checking",
    currency,
    name: org ?? "unknown",
  };
}

function parseTransactions(body: string): ParsedTransaction[] {
  const list = aggregate(body, "BANKTRANLIST") ?? body;
  const chunks = list.split(/<STMTTRN>/i).slice(1); // drop preamble before first txn
  const transactions: ParsedTransaction[] = [];

  for (const chunk of chunks) {
    const block = chunk.split(/<\/STMTTRN>/i)[0]; // up to close, or whole chunk
    const amountRaw = field(block, "TRNAMT");
    const dateRaw = field(block, "DTPOSTED");
    if (amountRaw === undefined || dateRaw === undefined) continue;

    const name = field(block, "NAME");
    const memo = field(block, "MEMO");
    transactions.push({
      date: parseOfxDate(dateRaw),
      amountCents: parseAmountToCents(amountRaw),
      description: [name, memo].filter(Boolean).join(" — "),
      fitid: field(block, "FITID"),
      memo,
    });
  }

  return transactions;
}

function mapAccountType(raw: string | undefined): AccountType {
  return (raw ?? "").toUpperCase() === "SAVINGS" ? "savings" : "checking";
}

function accountName(org: string | undefined, acctId: string): string {
  const masked = acctId.length > 4 ? `····${acctId.slice(-4)}` : acctId;
  return org ? `${org} ${masked}` : masked;
}
