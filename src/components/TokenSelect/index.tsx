import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TokenItem = {
  address: string
  logoURI: string
  symbol: string
}

export type TokenSelectProps = {
  onValueChange: (v: string) => void,
  options: TokenItem[]
  value: string
}

const TokenSelect = (props: TokenSelectProps) => {
  const { onValueChange, options, value } = props

  return (
    <Select value={value} onValueChange={val => onValueChange?.(val)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a token" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options?.map(item => (
            <SelectItem
              key={item.address}
              value={item.address}
            >
              <div className='flex items-center gap-[5px]'>
                <img src={item.logoURI} width={20} height={20} />
                {item.symbol}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default TokenSelect