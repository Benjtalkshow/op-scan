import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fromUnixTime, formatDistance } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  formatEther as viemFormatEther,
  formatGwei as viemFormatGwei,
  Address,
  Hex,
  TransactionType,
  Log,
  getAddress,
  parseEventLogs,
} from "viem";
import { capitalize } from "lodash";
import { Erc20Transfer, NftTransfer } from "@/lib/types";
import erc20Abi from "@/lib/contracts/erc-20/abi";
import erc721Abi from "@/lib/contracts/erc-721/abi";
import erc1155Abi from "@/lib/contracts/erc-1155/abi";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatEther = (wei: bigint, precision = 5) =>
  new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(Number(viemFormatEther(wei)));

export const formatGwei = (wei: bigint, precision = 8) =>
  new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(Number(viemFormatGwei(wei)));

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    price,
  );

export const formatPercent = (
  percent: number,
  signDisplay: "auto" | "never" | "always" | "exceptZero" = "auto",
) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
    signDisplay,
  }).format(percent);

export const formatTimestamp = (timestamp: bigint) => {
  const timestampDate = fromUnixTime(Number(timestamp));
  return {
    distance: formatDistance(timestampDate, new Date(), {
      includeSeconds: true,
      addSuffix: true,
    }),
    utc: formatInTimeZone(timestampDate, "UTC", "yyyy-dd-MM hh:mm:ss"),
    utcWithTz: formatInTimeZone(
      timestampDate,
      "UTC",
      "MMM-dd-yyyy hh:mm:ss aa +z",
    ),
    originalTimestamp: timestamp,
  };
};

export const formatAddress = (address: Address) =>
  `${address.slice(0, 10)}…${address.slice(-8)}`;

export const formatNumber = (
  value: number | bigint,
  options?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat("en-US", options).format(value);

export const formatGas = (value: bigint, total: bigint = BigInt(1)) => ({
  value: formatNumber(value),
  percentage: (Number(value) / Number(total)) * 100,
  percentageFormatted: formatPercent(Number(value) / Number(total)),
});

export const formatTransactionType = (type: TransactionType, typeHex: Hex) => {
  const typeString = type.startsWith("eip")
    ? `EIP-${type.slice(3)}`
    : capitalize(type);
  return `${Number(typeHex)} (${typeString})`;
};

export const parseErc20Transfers = (logs: Log[]): Erc20Transfer[] =>
  parseEventLogs({
    abi: erc20Abi,
    eventName: "Transfer",
    logs,
  }).map(
    ({
      blockNumber,
      transactionIndex,
      logIndex,
      transactionHash,
      args,
      address,
    }) => ({
      blockNumber,
      transactionIndex,
      logIndex,
      transactionHash,
      address: getAddress(address),
      from: getAddress(args.from),
      to: getAddress(args.to),
      value: args.value,
    }),
  );

export const parseErc721Transfers = (logs: Log[]): NftTransfer[] =>
  parseEventLogs({
    abi: erc721Abi,
    eventName: "Transfer",
    logs,
  }).map(
    ({
      blockNumber,
      transactionIndex,
      logIndex,
      transactionHash,
      args,
      address,
    }) => ({
      blockNumber,
      transactionIndex,
      logIndex,
      transactionHash,
      address: getAddress(address),
      operator: null,
      from: getAddress(args.from),
      to: getAddress(args.to),
      tokenId: args.tokenId,
      value: BigInt(1),
      erc721TokenAddress: getAddress(address),
      erc1155TokenAddress: null,
    }),
  );

export const parseErc1155Transfers = (logs: Log[]): NftTransfer[] => {
  const transfersSingle = parseEventLogs({
    abi: erc1155Abi,
    eventName: "TransferSingle",
    logs,
  }).map(
    ({
      blockNumber,
      transactionIndex,
      logIndex,
      transactionHash,
      args,
      address,
    }) => ({
      blockNumber,
      transactionIndex,
      logIndex,
      transactionHash,
      address: getAddress(address),
      operator: getAddress(args.operator),
      from: getAddress(args.from),
      to: getAddress(args.to),
      tokenId: args.id,
      value: args.value,
      erc721TokenAddress: null,
      erc1155TokenAddress: getAddress(address),
    }),
  );
  const transfersBatch = parseEventLogs({
    abi: erc1155Abi,
    eventName: "TransferBatch",
    logs,
  }).reduce<NftTransfer[]>(
    (
      previousValue,
      {
        blockNumber,
        transactionIndex,
        logIndex,
        transactionHash,
        args,
        address,
      },
    ) => [
      ...previousValue,
      ...args.ids.map((tokenId, i) => ({
        blockNumber,
        transactionIndex,
        logIndex,
        transactionHash,
        address: getAddress(address),
        operator: getAddress(args.operator),
        from: getAddress(args.from),
        to: getAddress(args.to),
        tokenId,
        value: args.values[i],
        erc721TokenAddress: null,
        erc1155TokenAddress: getAddress(address),
      })),
    ],
    [],
  );
  return [...transfersSingle, ...transfersBatch];
};
