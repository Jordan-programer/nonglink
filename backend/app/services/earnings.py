"""Platform commission math shared by farmer sales and transporter earnings.

Purely a running total for display — there's no payout/bank-transfer
integration in this app yet, so "available balance" is informational
(gross sales minus the platform's cut), not tied to an actual ledger.
"""

PLATFORM_COMMISSION_RATE = 0.05


def compute_earnings(gross_sales: float) -> dict:
    commission = gross_sales * PLATFORM_COMMISSION_RATE
    return {
        "gross_sales": gross_sales,
        "commission_rate": PLATFORM_COMMISSION_RATE,
        "commission": commission,
        "available_balance": gross_sales - commission,
    }
