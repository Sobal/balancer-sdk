// 0x97207B095e4D5C9a6e4cfbfcd2C3358E03B90c4A

import { Interface } from '@ethersproject/abi';
import { formatUnits } from '@ethersproject/units';
import { Multicall } from '@/contracts';

const iProtocolFeePercentagesProvider = new Interface([
  'function getSwapFeePercentage() view returns (uint)',
]);

export interface ProtocolFees {
  swapFee: number;
  yieldFee: number;
}

// Using singleton here, so subsequent calls will return the same promise
let feesPromise: Promise<ProtocolFees>;

export class ProtocolFeesProvider {
  protocolFees?: ProtocolFees;

  constructor(
    private multicall: Multicall,
    private protocolFeePercentagesProviderAddress: string
  ) {}

  private async fetch(): Promise<ProtocolFees> {
    const payload = [
      {
        target: this.protocolFeePercentagesProviderAddress,
        callData: iProtocolFeePercentagesProvider.encodeFunctionData(
          'getFeeTypePercentage',
          [0]
        ),
      },
      {
        target: this.protocolFeePercentagesProviderAddress,
        callData: iProtocolFeePercentagesProvider.encodeFunctionData(
          'getFeeTypePercentage',
          [2]
        ),
      },
    ];
    const [, res] = await this.multicall.callStatic.aggregate(payload);

    const fees = {
      swapFee: parseFloat(formatUnits(res[0], 18)),
      yieldFee: parseFloat(formatUnits(res[2], 18)),
    };

    return fees;
  }

  async getFees(): Promise<ProtocolFees> {
    if (!feesPromise) {
      feesPromise = this.fetch();
    }
    this.protocolFees = await feesPromise;

    return this.protocolFees;
  }
}
