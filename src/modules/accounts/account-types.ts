import type { AccountType } from "@/core/domain/transaction";

/** Account type options with their PT labels (escopo §4 account types). */
export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Dinheiro" },
  { value: "brokerage", label: "Corretora" },
];
