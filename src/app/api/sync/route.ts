import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, getUnixTime } from "date-fns";
import { UTCDate } from "@date-fns/utc";
import {
  fetchL2BlockNumberFromJsonRpc,
  fetchL2BlockNumberFromDatabase,
  fetchL1BlockNumberFromJsonRpc,
  fetchL1BlockNumberFromDatabase,
} from "@/lib/fetch-data";
import { indexL1Block, indexL2Block } from "@/lib/indexer";
import { l2Chain } from "@/lib/chains";
import { transactionsHistoryCount } from "@/lib/constants";

export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  try {
    const [
      l2BlockNumberFromJsonRpc,
      l2BlockNumberFromDatabase,
      l1BlockNumberFromJsonRpc,
      l1BlockNumberFromDatabase,
    ] = await Promise.all([
      fetchL2BlockNumberFromJsonRpc(),
      fetchL2BlockNumberFromDatabase(),
      fetchL1BlockNumberFromJsonRpc(),
      fetchL1BlockNumberFromDatabase(),
    ]);
    const l2BlocksIndexed: number[] = [];
    const l1BlocksIndexed: number[] = [];
    for (
      let blockNumber = l2BlockNumberFromJsonRpc;
      blockNumber > l2BlockNumberFromDatabase;
      --blockNumber
    ) {
      const block = await prisma.block.findUnique({
        where: { number_chainId: { number: blockNumber, chainId: l2Chain.id } },
      });
      if (!block) {
        await indexL2Block(blockNumber, l2Chain.id);
        l2BlocksIndexed.push(Number(blockNumber));
      }
    }
    for (
      let blockNumber = l1BlockNumberFromJsonRpc;
      blockNumber > l1BlockNumberFromDatabase;
      --blockNumber
    ) {
      const block = await prisma.l1Block.findUnique({
        where: { number_chainId: { number: blockNumber, chainId: l2Chain.id } },
      });
      if (!block) {
        await indexL1Block(blockNumber, l2Chain.id);
        l1BlocksIndexed.push(Number(blockNumber));
      }
    }
    const [{ count: deletedBlocksCount }, { count: deletedL1BlocksCount }] =
      await Promise.all([
        prisma.block.deleteMany({
          where: {
            chainId: l2Chain.id,
            timestamp: {
              lt: getUnixTime(subDays(new UTCDate(), transactionsHistoryCount)),
            },
          },
        }),
        prisma.l1Block.deleteMany({
          where: {
            chainId: l2Chain.id,
            timestamp: {
              lt: getUnixTime(subDays(new UTCDate(), transactionsHistoryCount)),
            },
          },
        }),
      ]);
    return Response.json({
      ok: true,
      l2BlockNumberFromJsonRpc: l2BlockNumberFromJsonRpc.toString(),
      l2BlockNumberFromDatabase: l2BlockNumberFromDatabase.toString(),
      l2BlocksIndexed: l2BlocksIndexed.sort(),
      l1BlockNumberFromJsonRpc: l1BlockNumberFromJsonRpc.toString(),
      l1BlockNumberFromDatabase: l1BlockNumberFromDatabase.toString(),
      l1BlocksIndexed: l1BlocksIndexed.sort(),
      deletedBlocksCount,
      deletedL1BlocksCount,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        ok: false,
      },
      { status: 500 },
    );
  }
};
