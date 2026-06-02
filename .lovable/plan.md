## Plan

1. **Stop hiding the real SignalWire rows**
   - Update the SMS Logs page so it prioritizes rows from `sms_logs` (the source of truth for provider activity) over duplicate `campaign_sends` rows.
   - This will prevent old generic campaign rows like `Outbound API` / wrong-number attempts from making it look like SignalWire never received the send.

2. **Show provider evidence clearly**
   - For each SMS row that reached SignalWire, show a visible `Reached SignalWire` badge.
   - Show the provider response details already stored in the database: SignalWire code, HTTP status, and message SID when present.
   - Add the error text under failed rows so `SignalWire 10000` is visible without needing backend logs.

3. **Make campaign SMS logging consistent**
   - Keep campaign summary rows in `campaign_sends`, but make sure SMS delivery/provider status is recorded in `sms_logs` and surfaced first in the UI.
   - Preserve the Leads/Customers-only guard so SMS and emails only go to contact records.

4. **Improve the send-now response**
   - Update `send-campaign` so full SMS delivery failures return a handled `success: false` payload instead of a frontend-breaking non-2xx response.
   - Include `byChannel` and `firstSmsError` so the UI can show “SignalWire rejected this” instead of a generic campaign error.

## Technical notes

- Recent database rows show SignalWire responses are being written to `sms_logs` with metadata like `provider: signalwire`, `provider_code: 10000`, and `provider_status: 422`.
- The screenshot appears to be showing SignalWire’s external Message Logs or older campaign rows, not the app’s updated provider-aware `sms_logs` view.
- No database schema change is needed unless the current migration has not been applied in the target environment.