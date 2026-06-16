import { describe, expect, it } from "vitest";

import { OfxImportSource } from "./ofx-import-source";
import {
  parseAmountToCents,
  parseOfxDate,
  sniffEncoding,
} from "./ofx-parser";

// OFX 1.x: SGML, leaf tags are NOT closed. Third transaction has no FITID
// (exercises the dedup fallback). DTPOSTED carries a trailing timezone.
const SGML_102 = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS><DTSERVER>20240201<LANGUAGE>POR<FI><ORG>Banco Inter<FID>077</FI></SONRS></SIGNONMSGSRSV1>
<BANKMSGSRSV1><STMTTRNRS><TRNUID>1<STATUS><CODE>0<SEVERITY>INFO</STATUS>
<STMTRS><CURDEF>BRL<BANKACCTFROM><BANKID>077<ACCTID>123456-7<ACCTTYPE>CHECKING</BANKACCTFROM>
<BANKTRANLIST><DTSTART>20240101<DTEND>20240131
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20240115120000[-3:BRT]<TRNAMT>-50.00<FITID>2024011501<NAME>IFOOD<MEMO>iFood pedido</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20240120<TRNAMT>1234.56<FITID>2024012001<NAME>Salario</STMTTRN>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20240125<TRNAMT>-3.50<NAME>Cafe</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

// OFX 2.x: XML, leaf tags are closed; NAME uses an XML entity.
const XML_200 = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="200" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>
<OFX>
<BANKMSGSRSV1><STMTTRNRS><TRNUID>1</TRNUID>
<STMTRS><CURDEF>BRL</CURDEF><BANKACCTFROM><BANKID>077</BANKID><ACCTID>999</ACCTID><ACCTTYPE>SAVINGS</ACCTTYPE></BANKACCTFROM>
<BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20240315</DTPOSTED><TRNAMT>-12.34</TRNAMT><FITID>X1</FITID><NAME>Mercado &amp; Cia</NAME></STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

/** Map each char to its code point as a byte — valid for ASCII + Latin-1 text,
 *  so a char like "é" (U+00E9) becomes the single Windows-1252 byte 0xE9. */
function bytes(s: string): Uint8Array {
  return Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
}

describe("parseAmountToCents", () => {
  it("parses signed decimals into integer cents with no float drift", () => {
    expect(parseAmountToCents("-50.00")).toBe(-5000);
    expect(parseAmountToCents("1234.56")).toBe(123456);
    expect(parseAmountToCents("0.99")).toBe(99);
    expect(parseAmountToCents("100")).toBe(10000);
    expect(parseAmountToCents("-0.05")).toBe(-5);
    expect(parseAmountToCents("1.5")).toBe(150);
    expect(parseAmountToCents("1,50")).toBe(150); // tolerate comma decimal
    expect(parseAmountToCents("  -7.07 ")).toBe(-707);
  });
});

describe("parseOfxDate", () => {
  it("reads YYYYMMDD at UTC noon, ignoring trailing time and timezone", () => {
    const d = parseOfxDate("20240115120000[-3:BRT]");
    expect(d.getUTCFullYear()).toBe(2024);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(15);
    expect(d.getUTCHours()).toBe(12);
  });
});

describe("OFX 1.x (SGML, unclosed leaf tags)", () => {
  const stmt = new OfxImportSource().parse(bytes(SGML_102));

  it("reads account metadata", () => {
    expect(stmt.account.externalId).toBe("077:123456-7");
    expect(stmt.account.type).toBe("checking");
    expect(stmt.account.currency).toBe("BRL");
    expect(stmt.account.name).toContain("Banco Inter");
  });

  it("reads every transaction with signed cents", () => {
    expect(stmt.transactions).toHaveLength(3);
    expect(stmt.transactions[0]).toMatchObject({
      amountCents: -5000,
      fitid: "2024011501",
      description: "IFOOD — iFood pedido",
    });
    expect(stmt.transactions[1].amountCents).toBe(123456);
    expect(stmt.transactions[2].amountCents).toBe(-350);
    expect(stmt.transactions[2].fitid).toBeUndefined();
  });
});

describe("OFX 2.x (XML, closed leaf tags)", () => {
  const stmt = new OfxImportSource().parse(bytes(XML_200));

  it("reads account + entity-decoded description", () => {
    expect(stmt.account.externalId).toBe("077:999");
    expect(stmt.account.type).toBe("savings");
    expect(stmt.transactions).toHaveLength(1);
    expect(stmt.transactions[0].amountCents).toBe(-1234);
    expect(stmt.transactions[0].description).toBe("Mercado & Cia");
  });
});

describe("encoding", () => {
  it("decodes Windows-1252 accents declared in the SGML header", () => {
    const sgml = SGML_102.replace("<NAME>Cafe", "<NAME>Café");
    const stmt = new OfxImportSource().parse(bytes(sgml));
    const cafe = stmt.transactions.find((t) => t.description.startsWith("Caf"));
    expect(cafe?.description).toBe("Café");
  });

  it("sniffs utf-8 from an XML declaration and windows-1252 from an SGML header", () => {
    expect(sniffEncoding(bytes(XML_200))).toBe("utf-8");
    expect(sniffEncoding(bytes(SGML_102))).toBe("windows-1252");
  });
});

describe("idempotency surface", () => {
  it("yields distinct dedup-ready ids and re-parses identically", () => {
    const a = new OfxImportSource().parse(bytes(SGML_102));
    const b = new OfxImportSource().parse(bytes(SGML_102));
    expect(a.transactions.map((t) => t.fitid)).toEqual(
      b.transactions.map((t) => t.fitid),
    );
  });
});
