// import Image from "next/image";
'use client';
import React, { FC, useMemo, useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, VersionedTransaction } from '@solana/web3.js';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
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
  const { toast } = useToast()

  const [loading, setLoading] = useState(false);
  const [tokenList, setTokenList] = useState();
  const [fromToken, setFromToken] = useState<string>(USDC_ADDRESS);
  const [toToken, setToToken] = useState<string>(SOL_ADDRESS);
  const [fromAmount, setFromAmount] = useState<number>(0);
  const [toAmount, setToAmount] = useState<number>(0);
  const [slippageBps, setSlippageBps] = useState<number>(0.5);
  const [quoteResponse, setQuoteResponse] = useState();
  const [txList, setTxList] = useState<string[]>([]);


  const fromRef = useRef()
  const toRef = useRef()
  const timerRef = useRef()
  // console.log(publicKey)

  // 获取账户余额
  async function getBalance() {
    if (!publicKey) return
    console.log('publicKey', publicKey)
    console.log('connection', connection)
    try {

      const balance = await connection.getBalance(publicKey);
      console.log('Account balance:', balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }

  // 更新【输入token】和【输出token】数量
  const updateAmount = async (
    type: 'from' | 'to',
    inMint: string,
    outMint: string,
    amount: number,
    slippage: number
  ) => {
    if (!inMint || !outMint || !tokenList || !Array.isArray(tokenList)) return;
    setLoading(true)
    try {
      const fromTokenInfo = tokenList.find(t => t.address === inMint)
      const toTokenInfo = tokenList.find(t => t.address === outMint)

      if (type === 'from') {
        // 根据【输入token】数量计算【输出token】的数量
        const _fromAmount = Number(amount) * (10 ** (fromTokenInfo?.decimals ?? 1))
        setFromAmount(_fromAmount)
        const quoteRes = await getQuote(
          inMint,
          outMint,
          _fromAmount,
          slippage * 100
        )
        const out = Number(quoteRes.outAmount) / (10 ** toTokenInfo.decimals)
        toRef.current.value = out
        setToAmount(out)
        setQuoteResponse(quoteRes)
      } else {
        // 根据【输出token】数量计算【输入token】的数量
        const _toAmount = Number(amount) * (10 ** (toTokenInfo?.decimals ?? 1))
        setToAmount(_toAmount)
        const quoteRes = await getQuote(
          outMint,
          inMint,
          _toAmount,
          slippage * 100
        )
        const out = Number(quoteRes.outAmount) / (10 ** fromTokenInfo.decimals)
        fromRef.current.value = out
        setFromAmount(out)
        setQuoteResponse(quoteRes)
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
    timerRef.current = setTimeout(() => {
      updateAmount(type, inMint, outMint, amount, slippageBps)
    }, 15000);
  }

  const handleFromTokenInput = debounce((e) => {
    const amount = e.target.value
    toRef.current.value = ''
    if (!amount || isNaN(Number(amount))) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return;
    }
    updateAmount('from', fromToken, toToken, amount, slippageBps)
  }, 500)

  const handleToTokenInput = debounce((e) => {
    const amount = e.target.value
    fromRef.current.value = ''
    if (!amount || isNaN(Number(amount))) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return;
    }
    updateAmount('to', fromToken, toToken, amount, slippageBps)
  }, 500)

  const handleSubmit = async () => {
    try {
      if (!publicKey) throw new WalletNotConnectedError();
      if (!quoteResponse || !fromToken || !toToken) {
        return;
      }

      // 开始
      const { swapTransaction } = await swap(quoteResponse, publicKey)

      // 解构
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      const txid = await sendTransaction(transaction, connection)

      console.log(txid)

      setTxList([txid, ...txList])

      console.log(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}`
      )
      console.log(`https://solscan.io/tx/${txid}`);

      toast({
        title: "交易处理中...",
        description: "点击【查看】跳转到区块链浏览器查看详情",
        action: (
          <ToastAction
            altText="Goto schedule to undo"
            onClick={() => window.open(`https://solscan.io/tx/${txid}`)}
          >
            查看
          </ToastAction>
        ),
      })
    } catch (error) {

    }
  }

  // 交换in out方向
  const handleChangeDrection = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(0)

    fromRef.current && (fromRef.current.value = toAmount)
    toRef.current && (toRef.current.value = '')
    if (timerRef.current) clearTimeout(timerRef.current)
    setTimeout(() => {
      updateAmount('from', toToken, fromToken, toAmount, slippageBps)
    }, 200);
  }

  // 获取钱包地址的最近5次交易记录
  async function getRecentTransactions(limit = 5) {
    if (!publicKey) return

    try {
      // 获取最近的交易列表
      const transactions = await connection.getConfirmedSignaturesForAddress2(publicKey, { limit });

      // 遍历最近的5次交易记录并输出
      transactions.forEach((transaction, index) => {
        console.log(`Transaction ${index + 1}: ${transaction.signature}`, transaction);
      });
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    }
  }

  // 获取特定交易的状态
  async function getTransactionStatus(txid: string) {
    try {
      const status = await connection.getSignatureStatus(txid);
      console.log(status);
    } catch (error) {
      console.error('Error fetching transaction status:', error);
    }
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

  // useEffect(() => {
  //   if (slippageBps && fromToken && toToken && fromAmount && toAmount) { 
  //     updateAmount('from', fromToken, toToken, fromAmount, slippageBps)
  //   }
  // }, [slippageBps, fromToken, toToken, fromAmount, toAmount])

  useEffect(() => {
    getBalance()
    getTransactionStatus('j7f7QsJcCzHCKCgvyHyYc6jFMW8kpXGyvScjPeU5E1dtWgDmQ1TiWhoKV6JhX4EskUcXHQmQgM36JcLXGhe4rxY')
  }, [publicKey])

  return (
    <>
      <div className='flex w-full'>
        <TokenSelect
          value={fromToken}
          onValueChange={(v: string) => { setFromToken(v); console.log(v) }}
          options={tokenList}
        />
        <Input
          ref={fromRef}
          disabled={inputDisabled}
          type='number'
          placeholder='0.00'
          onInput={handleFromTokenInput}
        />
      </div>

      <div className='flex justify-center my-5 cursor-pointer' onClick={handleChangeDrection}>⇅</div>

      <div className='flex w-full'>
        <TokenSelect
          value={toToken}
          onValueChange={(v: string) => setToToken(v)}
          options={tokenList}
        />
        <Input
          ref={toRef}
          disabled={inputDisabled}
          type='number'
          placeholder='0.00'
          onInput={handleToTokenInput}
        />
      </div>

      <div className='flex items-center w-full mt-[20px]'>
        <div className='w-[100px]'>滑点设置：</div>
        <Input
          className='flex-1'
          type='number'
          placeholder='0.00'
          value={slippageBps}
          onChange={e => setSlippageBps(Number(e.target.value ?? 0))}
          step={0.1}
          min={0}
          max={100}
        />
        <div className='px-[5px]'>%</div>
      </div>

      <Button
        className='w-full mt-[20px]'
        disabled={submitDisabled}
        onClick={handleSubmit}
      >
        Swap
      </Button>
      <Button
        className='w-full mt-[20px]'
        onClick={getBalance}
      >
        get balance
      </Button>

      <div className='w-full mt-[20px]'>
        <div>交易记录：</div>
        <div>
          {txList.map(txid => (
            <a
              key={txid}
              target="_blank"
              href={`https://solscan.io/tx/${txid}`}
              className='block mb-[5px] cursor-pointer underline text-[14px]'
            >
              {`${txid.slice(0, 5)}...${txid.slice(txid.length - 5)}`}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

const Home: FC = () => {
  // solana网络可以选择 'devnet', 'testnet', 或 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet;

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
            <div className='flex mb-[20px] gap-[10px]'>
              <WalletMultiButton className='' />
              <WalletDisconnectButton className='' />
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