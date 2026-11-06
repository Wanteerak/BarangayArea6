# Manuscript Flowcharts - Andy-main (GitHub based)

Base: https://github.com/saimonjohnorapa-max/Andy-main
- `/` = LandingPage (Website), `/app` = MobileApp (Resident), `/admin` = AdminApp (Staff console)
- Backend: Laravel 12 + Sanctum + MySQL (`andy_mis`), frontend: React + TS + Tailwind

Style gaya ng GymTrack.pdf:
Oval Start/End, Hexagon Initialize, Diamond decision Yes/No, Parallelogram Input/Show, Cylinder Database, Circle connectors A,B,C...

## Files (Word-ready)
- `Appendix-C-Website-Flowchart.svg` / `.png` - Appendix C: Website (`components/LandingPage.tsx`)
  Start > Initialize Website (/) > Hero? > Features? > How it works? > Community preview? (Laravel Public API) > Directory preview? (Laravel Public API) > Get the app? (Download APK / Open app) > FAQs? (5) > CTA/Footer? > Staff sign-in? (Laravel MySQL) > Done? > End

- `Appendix-D-Desktop-Flowchart.svg` / `.png` - Appendix D: Desktop/Admin (`AdminApp.tsx`, `LoginView`, `CommunitySubmissionsView`, `AdminAccountsView`)
  Start > Initialize Admin (/admin) > Staff Login? (email+password+CSRF -> Laravel Sanctum) > Valid? > Try again? (A=back)
  > Temp password? (must_change_password, 12+ chars) > Valid? > Proceed to console
  > Resident/No access? (Resend temp pw / Resident -> Open /app) > A
  > Dashboard (C) > Residents (D) > Complaints Blotter (E) > Emergency & Rescue (F: incidents+centers+alerts+responders+equipment) > Operations+BDRRM (G) > Community inbox (H: kind/status filter, status+admin_note) > Officials (I) > Staff Accounts admin-only (J: create/edit role/active + temp creds) > Password/Session (K) > Logout? > End

- `Appendix-E-Mobile-Flowchart.svg` / `.png` - Appendix E: Mobile (`components/MobileApp.tsx`)
  Start > Initialize Resident app (/app) > Sign In? (Laravel resident login) > Valid? > Try again? (A)
  > Create account? (name+email, temp pw 24h email/display) > Issued? > Copy temp pw, sign in
  > Change password? (current+new 12+, resend if expired -> Laravel account API) > A
  > Home (C: hello + Send concern + 4 quick actions + advisory/alerts) > Submit concern (D: composer kind/subject/location/contact/desc) > Report incident (E: emergency + hotline notice) > Community updates (F) > Directory (G: hotlines tel + evacuation + officials) > Track reports (H: own submissions submitted/in_review/resolved/dismissed + admin_note) > Account (I: profile + sign out + back to site) > Logout? > End

## Gamit sa Word
Insert > Pictures > PNG. Pag mahaba (Desktop/Mobile), i-Crop per page gaya ng GymTrack (D = 6 pages, E = 3 pages), dugtungan sa connectors.
Edit labels: `build.js` tapos `node manuscript-flowcharts/build.js`.
