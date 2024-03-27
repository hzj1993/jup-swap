import { PublicKey } from '@solana/web3.js';
import { get, post } from './request';

export async function fetchStrictTokenList() {
    const tokenList = await get('https://token.jup.ag/strict');

    return tokenList
}

export async function getTokenPrice(ids: string, vsToken: string) {
    const tokenPrice = await get(`https://price.jup.ag/v4/price`, { ids, vsToken });

    return tokenPrice
}

export const getQuote = async (
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps = 50
) => {
    try {
        const quote = await get(
            'https://quote-api.jup.ag/v6/quote',
            {
                inputMint, // 输入token
                outputMint, // 输出token
                amount, // 交换数量
                slippageBps // slippage(滑点)
            }
        )
        return quote
    } catch (error) {
        console.error(error)
        return null
    }
}

export const swap = async (
    quoteResponse: any,
    publicKey: PublicKey
) => {
    // 开始
    const { swapTransaction } = await post('https://quote-api.jup.ag/v6/swap', {
      quoteResponse: quoteResponse,
      userPublicKey: publicKey.toString(),
      wrapAndUnwrapSol: true
    })
    return swapTransaction
}