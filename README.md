# AgoLinks and TrueSplit

**Turn any Blockchain action into a shareable, metadata-rich link on Twitter**


With ** AgoLinks**, we've developed a feature that converts blockchain-based actions (such as transactions, contract interactions, or layer-2 scaling operations) into easily shareable, metadata-rich links, optimized for platforms like Twitter. These "AgoLinks" contain essential metadata, including wallet addresses, transaction amounts, timestamps, and contract execution details. When shared on Twitter, these links generate dynamic, informative previews, making it simple for users to engage with blockchain actions directly from their timeline.

### Workflow:


**1. Blockchain Action Execution:**
   - A user initiates an action on Blockchain, such as sending tokens, executing a smart contract, or performing a transaction within the Blockchain ecosystem. This action is captured through the Blockchain transaction interface or smart contract interaction.

**2. Metadata Extraction:**
   - After the action is completed, key metadata related to the Blockchain transaction is extracted. This includes transaction IDs, wallet addresses, token amounts, and timestamps.
   - For smart contract interactions, additional metadata such as the contract address, the executed function, and any passed parameters are also captured.

**3. Creation of Blockchain Blink:**
   - The extracted metadata is then used to generate a Blockchain Blink. This is a unique URL that bundles all the essential details of the Blockchain action and encodes it in a way that is easy to share across social platforms, particularly on Twitter.

**4. Social Media Integration:**
   - The Blockchain Blink URL is designed to integrate seamlessly with Twitter’s rich metadata preview capabilities. When a user shares the link, Twitter automatically generates a detailed preview of the Blockchain action, showcasing important details such as the token amount, wallet addresses, transaction timestamp, and smart contract address. This enhances the visibility of Blockchain activities and fosters transparency.

**5. Shareable Link:**
   - The Blockchain Blink is now ready to be shared with a single click. It is fully optimized for social media, ensuring a clean and informative visual preview that makes it easy for others to understand the Blockchain action. This allows the community to share insights, highlight transactions, and promote Blockchain’s growing ecosystem with minimal effort.

**6. Trusplit Contracts:**

```
import { AmountShape } from '@agoric/ertp';
import { makeTracer } from '@agoric/internal';
import { withOrchestration } from '@agoric/orchestration/src/utils/start-helper.js';
import { ChainInfoShape } from '@agoric/orchestration/src/typeGuards.js';
import { InvitationShape } from '@agoric/zoe/src/typeGuards.js';
import { M } from '@endo/patterns';
import * as flows from './orca.flows.js';

const trace = makeTracer('ExpenseSplitter');

const SingleAmountRecord = M.and(
  M.recordOf(M.string(), AmountShape, { numPropertiesLimit: 1 }),
  M.not(harden({}))
);

const OrchestrationPowersShape = M.splitRecord({
  localchain: M.remotable('localchain'),
  orchestrationService: M.remotable('orchestrationService'),
  storageNode: M.remotable('storageNode'),
  timerService: M.remotable('timerService'),
  agoricNames: M.remotable('agoricNames')
});

export const meta = {
  privateArgsShape: M.and(
    OrchestrationPowersShape,
    M.splitRecord({
      marshaller: M.remotable('marshaller'),
    })
  ),
  customTermsShape: {
    chainDetails: M.recordOf(M.string(), ChainInfoShape),
  },
};
harden(meta);

const contract = async (
  zcf,
  privateArgs,
  zone,
  { orchestrateAll, zoeTools, chainHub }
) => {
  trace('expense splitter start contract');

  // Register chains and connections
  const { chainDetails } = zcf.getTerms();
  for (const [name, info] of Object.entries(chainDetails)) {
    const { connections = {} } = info;
    trace('register', name, {
      chainId: info.chainId,
      connections: Object.keys(connections),
    });
    chainHub.registerChain(name, info);
    for (const [chainId, connInfo] of Object.entries(connections)) {
      chainHub.registerConnection(info.chainId, chainId, connInfo);
    }
  }

  const { splitExpense } = orchestrateAll(flows, {
    localTransfer: zoeTools.localTransfer,
  });

  const publicFacet = zone.exo(
    'ExpenseSplitter Public Facet',
    M.interface('ExpenseSplitter PF', {
      makeSplitExpenseInvitation: M.callWhen().returns(InvitationShape),
    }),
    {
      makeSplitExpenseInvitation() {
        return zcf.makeInvitation(
          splitExpense,
          'Split an Expense',
          undefined,
          M.splitRecord({
            give: SingleAmountRecord,
            addresses: M.arrayOf(M.string()),
            amounts: M.arrayOf(M.nat()),
          })
        );
      },
    }
  );

  return { publicFacet };
};

export const start = withOrchestration(contract);
harden(start);

```

```
export const splitExpense = async (orch, { localTransfer }, seat, offerArgs) => {
  const { give, addresses, amounts } = seat.getProposal();
  const [[_kw, totalAmount]] = Object.entries(give);

  // Validate total amount matches sum of individual amounts
  assert(totalAmount.value === amounts.reduce((a, b) => a + b, 0n), 'Total amount mismatch');

  const agoric = await orch.getChain('agoric');
  const localAccount = await agoric.makeAccount();

  // Transfer total amount to local account
  await localTransfer(seat, localAccount, give);

  // Distribute to each address
  for (let i = 0; i < addresses.length; i++) {
    const destChain = await orch.getChain(addresses[i].split(':')[0]);
    const destAddr = addresses[i].split(':')[1];
    
    await localAccount.transfer(
      {
        value: destAddr,
        encoding: 'bech32',
        chainId: destChain.chainId,
      },
      { denom: 'uist', value: amounts[i] }
    );
  }

  seat.exit();
  return 'Expense split successfully';
};

// /**
//  * @import {GuestOf} from '@agoric/async-flow';
//  * @import {Amount} from '@agoric/ertp/src/types.js';
//  * @import {Marshaller, StorageNode} from '@agoric/internal/src/lib-chainStorage.js';
//  * @import {ChainAddress, Orchestrator} from '@agoric/orchestration';
//  * @import {ZoeTools} from '@agoric/orchestration/src/utils/zoe-tools.js';
//  * @import {Transfer} from './orca.contract.js';
//  * @import {DenomArg} from '@agoric/orchestration';

//  */

// import { M, mustMatch } from '@endo/patterns';
// import { makeTracer } from './debug.js';

// const trace = makeTracer('OrchFlows');

// /**
//  * Create an account on a Cosmos chain and return a continuing offer with
//  * invitations makers for Delegate, WithdrawRewards, Transfer, etc.
//  *
//  * @param {Orchestrator} orch
//  * @param {unknown} _ctx
//  * @param {ZCFSeat} seat
//  * @param {{ chainName: string, denom: string }} offerArgs
//  */
// export const makeAccount = async (orch, _ctx, seat, offerArgs) => {
//   trace('makeAccount');
//   mustMatch(offerArgs, M.splitRecord({ chainName: M.string() }));
//   const { chainName } = offerArgs;
//   trace('chainName', chainName);
//   seat.exit();
//   const chain = await orch.getChain(chainName);
//   const chainAccount = await chain.makeAccount();
//   trace('chainAccount', chainAccount);
//   return chainAccount.asContinuingOffer();
// };
// harden(makeAccount);

// /**
//  * Create an account on a Cosmos chain and return a continuing offer with
//  * invitations makers for Delegate, WithdrawRewards, Transfer, etc.
//  *
//  * @param {Orchestrator} orch
//  * @param {object} ctx
//  * @param {ZoeTools['localTransfer']} ctx.localTransfer
//  * @param {ZCFSeat} seat
//  * @param {{ chainName: string, denom: DenomArg }} offerArgs
//  */
// export const makeCreateAndFund = async (
//   orch,
//   { localTransfer },
//   seat,
//   { chainName, denom },
// ) => {
//   trace(
//     `invoked makeCreateAndFund with chain ${chainName}, and denom ${denom}`,
//   );
//   const { give } = seat.getProposal();
//   trace('give:', give);
//   const [[_kw, amt]] = Object.entries(give);

//   const [agoric, chain] = await Promise.all([
//     orch.getChain('agoric'),
//     orch.getChain(chainName),
//   ]);

//   const info = await chain.getChainInfo();
//   trace('chain info', info);

//   const assets = await agoric.getVBankAssetInfo();
//   trace('fetched assets:', assets);

//   const localAccount = await agoric.makeAccount();
//   trace('localAccount', localAccount);

//   const remoteAccount = await chain.makeAccount();
//   trace('remoteAccount', remoteAccount);
//   const [localAddress, remoteAddress] = await Promise.all([
//     localAccount.getAddress(),
//     remoteAccount.getAddress(),
//   ]);

//   trace('localAddress', localAddress);
//   trace('remoteAddress', remoteAddress);
//   trace('fund new orch account 2');

//   await localTransfer(seat, localAccount, give);
//   trace('after transfer');

//   await localAccount.transfer(
//     {
//       denom: 'ubld',
//       value: amt.value / 2n,
//     },
//     remoteAddress,
//   );
//   seat.exit();
//   const remoteChainBalance = await remoteAccount.getBalance('uosmo');
//   console.log('remoteChainBalance', remoteChainBalance);

//   return remoteAccount.asContinuingOffer();
// };
// harden(makeCreateAndFund);

```

```
import { E } from '@endo/far';
import { installContract } from './platform-goals/start-contract.js';
import { makeTracer } from './tools/debug.js';

/// <reference types="@agoric/vats/src/core/types-ambient"/>
/// <reference types="@agoric/zoe/src/contractFacet/types-ambient"/>

/**
 * @import {ERef} from '@endo/far';
 * @import {BootstrapManifest} from '@agoric/vats/src/core/lib-boot.js';
 * @import {ChainInfo, IBCConnectionInfo,} from '@agoric/orchestration';
 * @import {OrcaSF} from './orca.contract.js';
 * @import {ContractStartFunction} from '@agoric/zoe/src/zoeService/utils.js';
 */

const trace = makeTracer('ExpenseSplitter');
const { entries, fromEntries } = Object;

trace('start proposal module evaluating');

const contractName = 'orca';

/** @type {IBCConnectionInfo} */
const c1 = harden({
  id: 'connection-0',
  client_id: 'client-0',
  state: 3, // OPEN
  counterparty: harden({
    client_id: 'client-0',
    connection_id: 'connection-0',
    prefix: {
      key_prefix: 'key-prefix-0',
    },
  }),
  transferChannel: harden({
    portId: 'transfer',
    channelId: 'channel-0',
    counterPartyPortId: 'transfer',
    counterPartyChannelId: 'channel-1',
    ordering: 2, // ORDERED
    version: '1',
    state: 3, // OPEN
  }),
});

/** @type {Record<string, ChainInfo>} */
export const chainDetails = harden({
  agoric: {
    chainId: `agoriclocal`,
    stakingTokens: [{ denom: 'uist' }],
    connections: { 
      osmosislocal: c1,
      gaialocal: { 
        ...c1,
        id: 'connection-1',
        client_id: 'client-1',
        transferChannel: {
          ...c1.transferChannel,
          channelId: 'channel-2',
          counterPartyChannelId: 'channel-3',
        },
      },
    },
  },
  osmosis: {
    chainId: `osmosislocal`,
    stakingTokens: [{ denom: 'uosmo' }],
  },
  gaia: { 
    chainId: `gaialocal`,
    stakingTokens: [{ denom: 'uatom' }],
  },
});

/**
 * Given a record whose values may be promise, return a promise for a record with all the values resolved.
 *
 * @type { <T extends Record<string, ERef<any>>>(obj: T) => Promise<{ [K in keyof T]: Awaited<T[K]>}> }
 */
export const allValues = async obj => {
  const es = await Promise.all(
    entries(obj).map(([k, vp]) => E.when(vp, v => [k, v])),
  );
  return fromEntries(es);
};

/**
 * @param {BootstrapPowers & {installation: {consume: {orca: Installation<OrcaSF>}}}} permittedPowers
 * @param {{options: {[contractName]: {
 *   bundleID: string;
 *   chainDetails: Record<string, ChainInfo>,
 * }}}} config
 */
export const startOrcaContract = async (permittedPowers, config) => {
  trace('startExpenseSplitter()... 0.0.1', config);
  console.log(permittedPowers);
  console.log(config);
  const {
    consume: {
      agoricNames,
      board,
      chainTimerService,
      localchain,
      chainStorage,
      cosmosInterchainService,
      startUpgradable,
    },
    installation: {
      consume: { orca: orcaInstallation },
    },
    instance: {
      // @ts-expect-error not a WellKnownName
      produce: { orca: produceInstance },
    },
  } = permittedPowers;

  const installation = await orcaInstallation;

  const storageNode = await E(chainStorage).makeChildNode('orca');
  const marshaller = await E(board).getPublishingMarshaller();

  const { chainDetails: nameToInfo = chainDetails } =
    config.options[contractName];

  /** @type {StartUpgradableOpts<ContractStartFunction & OrcaSF>} **/
  const startOpts = {
    label: 'expense-splitter',
    installation,
    terms: { 
      chainDetails: nameToInfo,
      supportedTokens: ['uist'],
    },
    privateArgs: {
      localchain: await localchain,
      orchestrationService: await cosmosInterchainService,
      storageNode,
      timerService: await chainTimerService,
      agoricNames: await agoricNames,
      marshaller,
    },
  };

  trace('startOpts', startOpts);
  const { instance } = await E(startUpgradable)(startOpts);

  trace(contractName, '(re)started WITH RESET');
  produceInstance.reset();
  produceInstance.resolve(instance);
};

/** @type {BootstrapManifest} */
const orcaManifest = {
  [startOrcaContract.name]: {
    consume: {
      agoricNames: true,
      board: true,
      chainStorage: true,
      startUpgradable: true,
      zoe: true,
      localchain: true,
      chainTimerService: true,
      cosmosInterchainService: true,
    },
    installation: {
      produce: { orca: true },
      consume: { orca: true },
    },
    instance: {
      produce: { orca: true },
    },
  },
};
harden(orcaManifest);

export const getManifestForOrca = (
  { restoreRef },
  { installKeys, chainDetails },
) => {
  trace('getManifestForOrca', installKeys);
  return harden({
    manifest: orcaManifest,
    installations: {
      [contractName]: restoreRef(installKeys[contractName]),
    },
    options: {
      [contractName]: { chainDetails },
    },
  });
};

export const permit = harden({
  consume: {
    agoricNames: true,
    board: true,
    chainStorage: true,
    startUpgradable: true,
    zoe: true,
    localchain: true,
    chainTimerService: true,
    cosmosInterchainService: true,
  },
  installation: {
    consume: { orca: true },
    produce: { orca: true },
  },
  instance: { produce: { orca: true } },
  brand: { 
    consume: { IST: true },
    produce: {} 
  },
  issuer: { 
    consume: { IST: true },
    produce: {} 
  },
});

export const main = startOrcaContract;


```