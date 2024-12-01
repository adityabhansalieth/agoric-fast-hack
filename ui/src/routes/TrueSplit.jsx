import { useAgoric } from '@agoric/react-components';
import { useContext, useState } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { useContractStore } from '../store/contract';

const TrueSplit = () => {
  const { walletConnection, chainName: agoricChainName } = useAgoric();
  const { addNotification } = useContext(NotificationContext);
  const [amount, setAmount] = useState('');
  const [addresses, setAddresses] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const guidelines = false;

  const handleCreateSplit = async () => {
    setIsLoading(true);
    try {
      if (!walletConnection) {
        throw new Error('Please connect your wallet');
      }

      const { instances } = useContractStore.getState();
      const instance = instances?.['orca'];
      
      if (!instance) {
        throw new Error('Contract instance not found');
      }

      const splitId = Date.now();
      await walletConnection.makeOffer(
        {
          source: 'contract',
          instance,
          publicInvitationMaker: 'makeSplitInvitation',
        },
        {
          give: { Amount: amount },
          want: { Addresses: addresses.filter(addr => addr.trim()) },
        },
        {},
        (update) => {
          if (update.status === 'error') {
            addNotification({
              text: `Split failed: ${update.error}`,
              status: 'error',
            });
          }
          if (update.status === 'accepted') {
            addNotification({
              text: 'Split created successfully',
              status: 'success',
            });
          }
        },
        splitId
      );
    } catch (error) {
      addNotification({
        text: error.message,
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900">
      <div className="w-full max-w-2xl p-8">
        <div className="flex flex-col items-center justify-center rounded-xl bg-gray-800 p-8 shadow-2xl">
          <h1 className="mb-8 text-3xl font-bold text-white">Group Expense Split</h1>
          
          <div className="w-full space-y-6">
            <div className="flex flex-col">
              <label className="mb-2 text-lg font-medium text-gray-300">
                Amount (IST)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-lg bg-gray-700 p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>

            {addresses.map((addr, i) => (
              <div key={i} className="flex flex-col">
                <label className="mb-2 text-lg font-medium text-gray-300">
                  IBC Address {i + 1}
                </label>
                <input
                  value={addr}
                  onChange={(e) => {
                    const newAddrs = [...addresses];
                    newAddrs[i] = e.target.value;
                    setAddresses(newAddrs);
                  }}
                  className="rounded-lg bg-gray-700 p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter IBC address"
                />
              </div>
            ))}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setAddresses([...addresses, ''])}
                className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Address
              </button>

              <button
                onClick={handleCreateSplit}
                disabled={isLoading}
                className={`rounded-lg bg-green-600 px-8 py-3 font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isLoading ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Create Split'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TrueSplit;