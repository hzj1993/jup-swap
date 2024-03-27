// import Image from "next/image";
'use client';
import React, { FC, useMemo, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchStrictTokenList,
  getTokenPrice,
  getQuote,
  swap
} from '@/lib/jup';
import '@solana/wallet-adapter-react-ui/styles.css';


export function TokenSelect(props) {
  const { onValueChange, options } = props

  return (
    <Select onValueChange={val => onValueChange?.(val)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a token" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options?.map(item => (
            <SelectItem key={item.address} value={item.address}>{item.symbol}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

const SwapBox: FC = (props) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, wallet } = useWallet();
  const [tokenList, setTokenList] = useState();
  const [fromToken, setFromToken] = useState<string>();
  const [toToken, setToToken] = useState<string>();

  // console.log(publicKey)

  const handleFromTokenInput = debounce((e) => {

  }, 500)

  const handleToTokenInput = debounce((e) => {

  }, 500)

  useEffect(() => {
    fetchStrictTokenList().then(res => {
      console.log(res)
      setTokenList(res)
    })
  }, [])

  return (
    <>
      <div className='flex'>
        <TokenSelect
          onValueChange={v => setFromToken(v)}
          options={tokenList}
        />
        <Input
          placeholder='0.00'
          onChange={handleFromTokenInput}
        />
      </div>
      <div className='flex justify-center my-5'>TO</div>
      <div className='flex'>
        <TokenSelect
          onValueChange={v => setToToken(v)}
          options={tokenList}
        />
        <Input
          placeholder='0.00'
          onChange={handleToTokenInput}
        />
      </div>
      <Button >Swap</Button>
    </>
  )
}

const Home: FC = () => {
  // solana网络可以选择 'devnet', 'testnet', 或 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;


  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [new UnsafeBurnerWalletAdapter()],
    [network]
  );


  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          <WalletDisconnectButton />
          <SwapBox />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Home;