import { Hash } from "viem";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchTokensPrices } from "@/lib/fetch-data";
import TransactionDetails from "@/components/pages/tx/transaction-details";
import fetchTransactionDetails from "@/components/pages/tx/fetch-transaction-details";

const Tx = async ({ hash }: { hash: Hash }) => {
  const [{ transaction, confirmations, erc20Transfers }, tokensPrices] =
    await Promise.all([fetchTransactionDetails(hash), fetchTokensPrices()]);
  if (!transaction) {
    notFound();
  }
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-4 md:p-4">
      <h2 className="text-2xl font-bold tracking-tight">Transaction Details</h2>
      <Separator />
      <Card>
        <CardContent className="p-4">
          <TransactionDetails
            transaction={transaction}
            confirmations={confirmations}
            ethPriceToday={tokensPrices.eth.today}
            erc20Transfers={erc20Transfers}
          />
        </CardContent>
      </Card>
    </main>
  );
};

export default Tx;
