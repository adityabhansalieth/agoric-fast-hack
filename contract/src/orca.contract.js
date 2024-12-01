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