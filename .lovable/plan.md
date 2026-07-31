## Fix the debt auto-source

1. Change the North Stars `debt` source to total only the latest snapshots for credit-card accounts, explicitly excluding the car loan and other debt accounts.
2. Keep Finance values stored in USD, but convert the auto-sourced total to AED when the linked goal metric uses `AED`.
3. Preserve the saved quarterly target of **40,000 AED**. With the current Finance snapshot, the metric will display **52,450.50 / 40,000 AED** (`14,370 USD × 3.65`).
4. Update the source label/helper text so the UI clearly says it is linked to **Finance credit-card debt**, excluding the car loan.
5. Verify the North Stars page and weekly check-in show the same linked, read-only AED value without duplicate manual entry.