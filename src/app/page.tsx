// import Image from "next/image";
'use client';
import React, { FC, useMemo, useState, useEffect, useRef } from 'react';
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


const USDC_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';


export function TokenSelect(props) {
  const { onValueChange, options, value } = props

  return (
    <Select value={value} onValueChange={val => onValueChange?.(val)}>
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
  const [loading, setLoading] = useState(false);
  const [tokenList, setTokenList] = useState();
  const [fromToken, setFromToken] = useState<string>(USDC_ADDRESS);
  const [toToken, setToToken] = useState<string>(SOL_ADDRESS);

  const fromRef = useRef()
  const toRef = useRef()
  const timerRef = useRef()
  console.log(publicKey)

  const updateAmount = async (type: 'from' | 'to', amount: number) => {
    if (!fromToken || !toToken || !tokenList || !Array.isArray(tokenList)) return;
    setLoading(true)
    try {
      const fromTokenInfo = tokenList.find(t => t.address === fromToken)
      const toTokenInfo = tokenList.find(t => t.address === toToken)
      if (type === 'from') {
        const quoteRes = await getQuote(
          fromToken,
          toToken,
          Number(amount) * (10 ** (fromTokenInfo?.decimals ?? 1))
        )
        const out = Number(quoteRes.outAmount) / (10 ** toTokenInfo.decimals)
        toRef.current.value = out
      } else {
        const quoteRes = await getQuote(
          toToken,
          fromToken,
          Number(amount) * (10 ** (toTokenInfo?.decimals ?? 1))
        )
        const out = Number(quoteRes.outAmount) / (10 ** fromTokenInfo.decimals)
        fromRef.current.value = out
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
    timerRef.current = setTimeout(() => {
      updateAmount(type, amount)
    }, 5000);
  }

  const handleFromTokenInput = debounce((e) => {
    const amount = e.target.value
    toRef.current.value = ''
    if (!amount || isNaN(Number(amount))) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return;
    }
    updateAmount('from', amount)
  }, 500)

  const handleToTokenInput = debounce((e) => {
    const amount = e.target.value
    fromRef.current.value = ''
    if (!amount || isNaN(Number(amount))) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return;
    }
    updateAmount('to', amount)
  }, 500)

  const handleSubmit = () => {

  }

  const inputDisabled = useMemo(() => !fromToken || !toToken, [fromToken, toToken])
  const submitDisabled = useMemo(() => 
    loading || !publicKey || !fromToken || !toToken, 
    [loading, publicKey, fromToken, toToken]
  )

  useEffect(() => {
    fetchStrictTokenList().then(res => {
      setTokenList(res)
    })
  }, [])

  return (
    <>
      <div className='flex'>
        <TokenSelect
          value={fromToken}
          onValueChange={(v: string) => { setFromToken(v); console.log(v) }}
          options={tokenList}
        />
        <Input
          ref={fromRef}
          disabled={inputDisabled}
          placeholder='0.00'
          onInput={handleFromTokenInput}
        />
      </div>
      <div className='flex justify-center my-5'>TO</div>
      <div className='flex'>
        <TokenSelect
          value={toToken}
          onValueChange={(v: string) => setToToken(v)}
          options={tokenList}
        />
        <Input
          ref={toRef}
          disabled={inputDisabled}
          placeholder='0.00'
          onInput={handleToTokenInput}
        />
      </div>
      <Button disabled={submitDisabled} onClick={handleSubmit}>Swap</Button>
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