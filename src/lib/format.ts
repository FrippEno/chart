import type { ChartValueType } from './db/types';

export function isMoney(valueType: ChartValueType): boolean {
    return valueType === 'money';
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

export function formatMetric(rawValue: number, valueType: ChartValueType): string {
    const value = Math.round(rawValue * 100) / 100;
    return isMoney(valueType) ? currencyFormatter.format(value) : String(value);
}
