import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ContractProvider } from './providers/Contract';
import { AgoricProvider } from '@agoric/react-components';
import { Navbar } from './components/Navbar';
import { Tabs } from './components/Tabs';
import TrueSplit from './routes/TrueSplit';
import { ThemeProvider, useTheme } from '@interchain-ui/react';
import { wallets } from 'cosmos-kit';
import '@agoric/react-components/dist/style.css';
import { useEffect } from 'react';

function App() {
  const { themeClass, setTheme, setColorMode } = useTheme();
  
  useEffect(() => {
    setColorMode('dark');
    setTheme('dark');
  }, [setTheme, setColorMode]);

  return (
    <ThemeProvider>
      <div className={themeClass}>
        <AgoricProvider
          wallets={wallets.extension}
          agoricNetworkConfigs={[
            {
              testChain: {
                chainId: 'agoriclocal',
                chainName: 'agoric-local',
                iconUrl: 'agoric.svg',
              },
              apis: {
                rest: ['http://localhost:1317'],
                rpc: ['http://localhost:26657'],
              },
            },
            {
              testChain: {
                chainId: 'agoric-emerynet-8',
                chainName: 'emerynet',
                iconUrl: 'agoric.svg',
              },
              apis: {
                rest: ['https://emerynet.api.agoric.net'],
                rpc: ['https://emerynet.rpc.agoric.net'],
              },
            },
          ]}
          defaultChainName="agoric-local"
        >
          <ContractProvider>
            <BrowserRouter>
              <Navbar />
              <Routes>
                <Route path="/" element={<Tabs />} />
                <Route path="/truesplit" element={<TrueSplit />} />
            
              </Routes>
            </BrowserRouter>
          </ContractProvider>
        </AgoricProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;