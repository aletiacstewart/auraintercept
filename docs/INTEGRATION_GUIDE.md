# Connections guide

Everything is set up in one place: **Connections** (`/dashboard/integrations`). Each card shows status, what it is used for, roughly how long setup takes and who bills you. All third-party fees are charged by that provider directly, separate from the Aura plan.

## Calendar (Google)

1. Connections → Calendar → **Set up**.
2. Sign in with the Google account that owns the business calendar and allow access.
3. Bookings sync both ways from then on.

Troubleshooting: if the card says "Needs attention", the permission was withdrawn or the password changed — click **Set up** and sign in again. A red state on the Health tab with "token expired" means the same thing.

## Calls & texts (SignalWire)

Needs: Project ID, API Token (`PT…`), Space URL (`yourspace.signalwire.com`), and the business number in `+1…` form. The form rejects a full `https://` address in the space field and a number without a country code.

Troubleshooting: "authentication failed" means the token was revoked or belongs to another space — regenerate it in SignalWire and paste the new one.

## Email (Resend)

Needs an API key beginning `re_`, plus a verified sending domain in Resend. Without domain verification, email sends will be refused even though the key saves fine.

## AI voice (ElevenLabs)

In ElevenLabs: profile → API Keys → create a key → copy the **secret value**, which starts with `sk_`. The short ID shown next to the key in the list is not the key, and the form now rejects it with that message. The optional Agent ID starts with `agent_`.

Troubleshooting: a 401 in the Health tab means the key was deleted or rotated; a quota error means the ElevenLabs plan ran out of characters.

## Payments (Stripe)

Publishable key `pk_live_…` and secret key `sk_live_…` from the Stripe dashboard's API keys page. Test keys (`pk_test_…`) work for trying it out.

## Social posting (Upload-Post)

Upload-Post is the only automated publishing route: one connection covers up to six platforms. It is optional on every plan, billed by Upload-Post directly (roughly $9–$99/month). Without it, every plan still gets manual **Copy & Post**.

## Health tab

The Health tab on the same page shows, per connection: whether it is working, when it last worked, its 30-day reliability and the last error in plain English. **Check now** tests everything immediately; a nightly check fills in the history.
