/**
 * @file build core eval script to deploy expense splitter contract
 *
 * Usage:
 *   agoric run init-orca.js
 * or
 *   agoric run init-orca.js --net emerynet \
 *     --peer osmosis:connection-128:channel-115:uosmo \
 *     --peer gaia:connection-129:channel-116:uatom
 */
import { makeHelpers } from '@agoric/deploy-script-support';
import {
  CosmosChainInfoShape,
  IBCConnectionInfoShape,
} from '@agoric/orchestration/src/typeGuards.js';
import { M, mustMatch } from '@endo/patterns';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import {
  getManifestForOrca,
  startOrcaContract,
} from '../../src/orca.proposal.js';
import { makeAgd } from '../../tools/agd-lib.js';

/** @type {import('node:util').ParseArgsConfig['options']} */
const options = {
  net: { type: 'string' },
  peer: { type: 'string', multiple: true },
};

/** @type {CoreEvalBuilder} */
export const defaultProposalBuilder = async (
  { publishRef, install },
  { chainDetails },
) => {
  return harden({
    sourceSpec: '../../src/orca.proposal.js',
    getManifestCall: [
      getManifestForOrca.name,
      {
        installKeys: {
          orca: publishRef(install('../../src/orca.contract.js')),
        },
        chainDetails,
      },
    ],
  });
};

export default async (homeP, endowments) => {
  const { writeCoreEval } = await makeHelpers(homeP, endowments);
  const { scriptArgs } = endowments;
  const { values: flags } = parseArgs({ args: scriptArgs, options });

  /** @type {Record<string, CosmosChainInfo>} */
  const chainDetails = {};

  // Default local chain setup for testing
  if (!flags.net) {
    chainDetails['agoric'] = {
      chainId: 'agoriclocal',
      stakingTokens: [{ denom: 'uist' }], // Using IST as primary token
      connections: {
        osmosislocal: {
          id: 'connection-0',
          client_id: 'client-0',
          state: 3, // OPEN
          counterparty: {
            client_id: 'client-0',
            connection_id: 'connection-0',
            prefix: { key_prefix: 'key-prefix-0' },
          },
          transferChannel: {
            portId: 'transfer',
            channelId: 'channel-0',
            counterPartyPortId: 'transfer',
            counterPartyChannelId: 'channel-1',
            ordering: 2,
            version: '1',
            state: 3,
          },
        },
      },
    };
    
    chainDetails['osmosis'] = {
      chainId: 'osmosislocal',
      stakingTokens: [{ denom: 'uosmo' }],
    };

    chainDetails['gaia'] = {
      chainId: 'gaialocal', 
      stakingTokens: [{ denom: 'uatom' }],
    };
  } else {
    // Network deployment configuration
    // ... (keep existing network config code)
  }

  mustMatch(harden(chainDetails), M.recordOf(M.string(), CosmosChainInfoShape));
  await writeCoreEval(startOrcaContract.name, opts =>
    defaultProposalBuilder(opts, { chainDetails }),
  );
};
