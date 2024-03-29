'use client';
import React, { FC, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Toaster } from "@/components/ui/toaster";
import SwapBox from "@/components/SwapBox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import '@solana/wallet-adapter-react-ui/styles.css';


const NETWORK_OPTIONS = [
  { label: 'Mainnet', value: WalletAdapterNetwork.Mainnet },
  { label: 'Devnet', value: WalletAdapterNetwork.Devnet },
  { label: 'Testnet', value: WalletAdapterNetwork.Testnet },
]


const Home: FC = () => {
  // solana网络可以选择 'devnet', 'testnet', 或 'mainnet-beta'
  const [network, setNetwork] = useState<WalletAdapterNetwork>(WalletAdapterNetwork.Mainnet)

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [new UnsafeBurnerWalletAdapter()],
    [network]
  );


  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className='flex flex-col items-center px-[20px]'>
            <div className='flex items-center mb-[20px] gap-[10px]'>
              <WalletMultiButton className='' />
              <WalletDisconnectButton className='' />
              <Select value={network} onValueChange={(val: WalletAdapterNetwork) => setNetwork(val)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {NETWORK_OPTIONS?.map(item => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <SwapBox />
          </div>
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Home;