# Certificate Sharing Loop

Every issued certificate page (`/certificate/:serial`) is a growth surface: LinkedIn add-to-profile, image download, an embedded verification QR, and native share.

## User flow
1. A Yatri earns a certificate (training completion via the student dashboard, or event attendance via My Events) and lands on `/certificate/:serial`.
2. The certificate card shows the recipient, achievement, issue date, serial — and a **verification QR** that encodes the page URL ("Scan to verify"). Because the QR sits *inside* the card, every downloaded image is self-verifying.
3. Actions under the card:
   - **Add to LinkedIn profile** — deep link to LinkedIn's certification form, prefilled: name = certificate title, organization = "Yatri Cloud", issue month/year, `certUrl` = this page, `certId` = the serial. One click on LinkedIn's side to save.
   - **Download image** — html2canvas renders the card at 2× to a PNG named `Name_SERIAL.png`. Loader state on the button; a friendly toast if rendering fails.
   - **Share** — `navigator.share` where available, clipboard fallback with a toast.
4. Anyone opening the link (or scanning the QR) sees the verified certificate — the page doubles as the public verifier.

## Code map
| Piece | File |
|---|---|
| Page + all sharing logic | `src/pages/CertificateView.tsx` (`linkedInAddUrl`, `downloadImage`, `shareCertificate`, `certRef`) |
| QR | `qrcode.react` → `QRCodeCanvas` (canvas variant renders correctly under html2canvas; size 76, level M) |
| Data | `getCertificateBySerial` in `src/lib/training-api.ts` (`certificates` table; public read by serial) |

## LinkedIn URL format
```
https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME
  &name={title}&organizationName=Yatri%20Cloud
  &issueYear={y}&issueMonth={m}
  &certUrl={pageUrl}&certId={serial}
```

## Gotchas
- Use `QRCodeCanvas` (not the SVG variant) — html2canvas support for SVG is unreliable.
- `pageUrl` is built from `window.location.origin` with a hardcoded production fallback for non-browser contexts.
- Not-found serials render a friendly "Certificate not found" page with `noindex`.

## How to test
Open any issued certificate → Download (check the PNG includes the QR; scan it back to the page) → Add to LinkedIn (form fields arrive prefilled) → Share on a phone (native sheet) and desktop (clipboard toast).
