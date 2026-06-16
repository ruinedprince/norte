import type { ImportSource, ParsedStatement } from "../../ports/import-source";
import { decodeOfx, parseOfx } from "./ofx-parser";

/**
 * OFX implementation of the ImportSource port. Decodes the raw bytes using the
 * charset declared in the OFX header, then parses the statement. Handles OFX
 * 1.x (SGML) and 2.x (XML); see ofx-parser.ts for the tolerant tag handling.
 */
export class OfxImportSource implements ImportSource {
  parse(content: Uint8Array): ParsedStatement {
    return parseOfx(decodeOfx(content));
  }
}
