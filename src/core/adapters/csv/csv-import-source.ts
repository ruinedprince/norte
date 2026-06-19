import type { ParsedTransaction } from "../../ports/import-source";
import { decodeCsv, parseCsv } from "./csv-parser";

/**
 * CSV import (escopo §6 fallback for OFX). Unlike OFX, a CSV carries no account
 * identifier, so it yields transactions only — the caller attaches the account
 * the user picked. Decodes UTF-8, falling back to windows-1252 for Latin-1.
 */
export class CsvImportSource {
  parse(content: Uint8Array): ParsedTransaction[] {
    return parseCsv(decodeCsv(content));
  }
}
