// Charts whose y-axis label mentions "$" (e.g. "Savings ($)", "Net worth ($)")
// have their values rendered as currency instead of a bare number.
export function isMoneyLabel(label: string): boolean {
    return /\$/.test(label);
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

export function formatMetric(rawValue: number, label: string): string {
    const value = Math.round(rawValue * 100) / 100;
    return isMoneyLabel(label) ? currencyFormatter.format(value) : String(value);
}
