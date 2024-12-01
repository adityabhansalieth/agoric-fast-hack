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
