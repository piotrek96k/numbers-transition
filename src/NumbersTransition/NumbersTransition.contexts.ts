import { Context, createContext } from 'react';
import { OptimizationStrategies } from './NumbersTransition.enums';

export const OptimizationStrategyContext: Context<OptimizationStrategies> = createContext<OptimizationStrategies>(
  OptimizationStrategies.NONE,
);
