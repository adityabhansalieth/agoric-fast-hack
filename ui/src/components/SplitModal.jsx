// src/components/SplitModal.jsx
import { useState } from 'react';

function SplitModal({ isOpen, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [addresses, setAddresses] = useState(['']);

  const handleSubmit = () => {
    onSubmit(amount, addresses.filter(addr => addr.trim()));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create Split Request</h3>
        
        <div className="mb-4">
          <label className="block mb-2">Amount (IST)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>

        {addresses.map((addr, i) => (
          <div key={i} className="mb-4">
            <label className="block mb-2">Address {i + 1}</label>
            <input
              value={addr}
              onChange={(e) => {
                const newAddrs = [...addresses];
                newAddrs[i] = e.target.value;
                setAddresses(newAddrs);
              }}
              className="w-full p-2 rounded bg-gray-700"
            />
          </div>
        ))}

        <button
          onClick={() => setAddresses([...addresses, ''])}
          className="mb-4 px-4 py-2 bg-blue-600 rounded"
        >
          Add Address
        </button>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 rounded"
          >
            Create Split
          </button>
        </div>
      </div>
    </div>
  );
}

export default SplitModal;