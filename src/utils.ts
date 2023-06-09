import { JWKInterface, Warp, WarpFactory } from 'warp-contracts';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import fs from 'fs';
import path from 'path';
import * as ethers from 'ethers';

const SERVERS_CONTRACT = 'hGmYeSsKUbP_W0968FUoLWPrmmi2k41HWAB0xSBG4M4';
export const DAILY_MESSAGES_LIMIT = 100;
export const DAILY_REACTIONS_LIMIT = 100;

export function isTxIdValid(txId: string): boolean {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  return validTxIdRegex.test(txId);
}

export function isEthWallet(txId: string): boolean {
  return ethers.isAddress(txId);
}

export async function connectToServerContract(warp: Warp, wallet: JWKInterface, serverId: string | null) {
  const contractTxId = await getServerContractId(serverId);
  return warp.contract(contractTxId).connect(wallet).setEvaluationOptions({ useKVStorage: true });
}

export async function getServerContractId(serverId: string | null) {
  if (!serverId) {
    throw new Error(`Server id not provided. Cannot connect to the contract.`);
  } else {
    const result = await getStateFromDre(SERVERS_CONTRACT);
    return result.state.servers[serverId].contractTxId;
  }
}
export function initializeWarp(): Warp {
  return WarpFactory.forMainnet().use(new DeployPlugin());
}

export function connectToServersContract(warp: Warp, wallet: JWKInterface) {
  return warp.contract(SERVERS_CONTRACT).connect(wallet).setEvaluationOptions({ useKVStorage: true });
}

export function readWallet() {
  return JSON.parse(fs.readFileSync(path.resolve('.secrets', 'wallet.json'), 'utf-8'));
}

export async function getStateFromDre(contractId: string, propertyToGet?: string, id?: string) {
  const dre1 = `dre-1`;
  const dre3 = `dre-3`;
  const dre5 = `dre-5`;
  try {
    const response = await fetchDre(dre1, contractId, propertyToGet, id);
    return response;
  } catch (e) {
    try {
      const response = await fetchDre(dre3, contractId, propertyToGet, id);
      return response;
    } catch (e) {
      try {
        const response = await fetchDre(dre5, contractId, propertyToGet, id);
        return response;
      } catch (e) {
        throw new Error(`Could not load state from DRE nodes.`);
      }
    }
  }
}

async function fetchDre(dre: string, contractId: string, propertyToGet?: string, id?: string) {
  return await fetch(
    `https://${dre}.warp.cc/contract?id=${contractId}${propertyToGet ? `&query=$.${propertyToGet}.${id}` : ''}`
  ).then((res) => {
    return res.json();
  });
}
