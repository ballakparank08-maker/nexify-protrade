import React from 'react';
import { FutureTradingTerminal } from './FutureTradingTerminal';

/**
 * StakingTerminal now hosts the Future / Contract Trading Terminal
 * per user specification to transform the staking page into future trading.
 */
export const StakingTerminal: React.FC = () => {
  return <FutureTradingTerminal />;
};
