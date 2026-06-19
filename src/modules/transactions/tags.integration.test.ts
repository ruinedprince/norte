import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  addTransactionTag,
  createManualTransaction,
  createTag,
  deleteTag,
  listTags,
  listTransactions,
  removeTransactionTag,
} from "./repository";

const ACCOUNT = "__tags_test__";
const TAG_A = "__tag_aluguel__";
const TAG_B = "__tag_viagem__";

async function cleanup() {
  await prisma.account.deleteMany({ where: { name: ACCOUNT } });
  await prisma.tag.deleteMany({ where: { name: { in: [TAG_A, TAG_B] } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("tags (real SQLite via Prisma 7)", () => {
  it("creates, attaches, filters, removes and cascades on delete", async () => {
    const account = await prisma.account.create({
      data: { name: ACCOUNT, type: "cash", currency: "BRL" },
    });
    const tx = await createManualTransaction({
      accountId: account.id,
      date: new Date(Date.UTC(2026, 0, 15, 12)),
      amountCents: -5000,
      description: "Tag test tx",
      categoryId: null,
    });
    const tagA = await createTag(TAG_A);
    const tagB = await createTag(TAG_B);

    // Attach A — the transaction now carries exactly that tag.
    await addTransactionTag(tx.id, tagA.id);
    const tagged = (await listTransactions(200)).find((t) => t.id === tx.id);
    expect(tagged?.tags.map((t) => t.tag.name)).toEqual([TAG_A]);

    // Filtering by A returns it; filtering by B excludes it.
    expect((await listTransactions(200, tagA.id)).some((t) => t.id === tx.id)).toBe(true);
    expect((await listTransactions(200, tagB.id)).some((t) => t.id === tx.id)).toBe(false);

    // Usage count reflects the single link.
    const countA = (await listTags()).find((t) => t.name === TAG_A);
    expect(countA?._count.transactions).toBe(1);

    // Detaching removes it from the filtered view.
    await removeTransactionTag(tx.id, tagA.id);
    expect((await listTransactions(200, tagA.id)).some((t) => t.id === tx.id)).toBe(false);

    // Re-attach, then deleting the tag cascades its links away.
    await addTransactionTag(tx.id, tagA.id);
    await deleteTag(tagA.id);
    const links = await prisma.transactionTag.findMany({ where: { tagId: tagA.id } });
    expect(links).toHaveLength(0);
  });
});
