import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { type TransactionsHistory } from "@/lib/types";

const ActiveAddresses = ({
  todayTransactionsHistory,
  totalTransactionsHistory,
}: {
  todayTransactionsHistory: TransactionsHistory;
  totalTransactionsHistory: TransactionsHistory;
}) => (
  <Card className="relative pl-8">
    <Gauge className="absolute top-6 left-4 size-6" />
    <CardHeader className="pb-2">
      <CardTitle className="flex flex-row items-center justify-between">
        <div className="text-sm font-medium">Active addresses today</div>
        <div className="text-sm font-medium">Total active addresses</div>
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-row items-center justify-between">
      <div className="text-sm">
        {formatNumber(todayTransactionsHistory.activeAddresses, {
          notation: "compact",
        })}
      </div>
      <div className="text-sm">
        {formatNumber(totalTransactionsHistory.activeAddresses, {
          notation: "compact",
        })}
      </div>
    </CardContent>
  </Card>
);

export default ActiveAddresses;
