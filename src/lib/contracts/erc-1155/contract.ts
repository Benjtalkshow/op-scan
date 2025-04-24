import { getContract, type Address, erc1155Abi } from "viem";
import { l2PublicClient } from "@/lib/chains";

const getErc1155Contract = (address: Address) =>
  getContract({
    address,
    abi: erc1155Abi,
    client: l2PublicClient,
  });

export default getErc1155Contract;
