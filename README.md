# Owl Weather (ISM4211)

A weather app for Florida Atlantic University, defaulting to the FAU Boca Raton campus.
Plain HTML/CSS/JavaScript with no build step, deployed on Netlify.

## Features
- Current conditions: temperature, feels-like, humidity, wind, rain chance, UV index, sunrise/sunset
- Next 24 hours and 7-day forecast
- Search any city, one-click return to FAU Boca, °F/°C toggle
- FAU brand colors: FAU Blue `#003366`, FAU Red `#CC0000` ([FAU style guide](https://www.fau.edu/styleguide/colors/))

## Login (Supabase Auth)
Users must sign in with email and password before the weather loads. Sign-up, sign-out and
"forgot password" are included. Code is in `public/auth.js`, using
[supabase-js](https://supabase.com/docs/reference/javascript/introduction) from the jsDelivr CDN.

- Supabase project: "Project for ism" (`qbiqgzfowfzpidhlpvxb`)
- Only the **publishable** key is in the code. It is meant to be public; never add a secret/service_role key.
- In the Supabase dashboard, **Authentication → URL Configuration**: set **Site URL** to your Netlify URL
  and add it under **Redirect URLs**, so confirmation and reset emails link back to the live site.
- The login gate is client-side only. That is fine here because the weather data is public; anything
  private should be stored in Supabase tables protected by Row Level Security.

## Data
Weather and city search come from the free [Open-Meteo](https://open-meteo.com/) API (no API key needed).
Default location: FAU Boca Raton campus, 26.3725, -80.1018.

## Logo
The header loads the FAU monogram from Wikimedia Commons
([File:Florida_Atlantic_University_monogram_logo.svg](https://commons.wikimedia.org/wiki/File:Florida_Atlantic_University_monogram_logo.svg)).
If it fails to load, a text "FAU" badge shows instead. To use an official file from
[FAU's logo downloads](https://www.fau.edu/university-communications/branding/visual-standards/),
save it as `public/fau-logo.svg` (or `.png`) and change the `<img src>` in `public/index.html`.
The FAU name and logo are trademarks of Florida Atlantic University; this is a class project.

## Deploy on Netlify
1. Sign in at https://app.netlify.com with GitHub.
2. Add new site → Import an existing project → GitHub → pick this repo.
3. Keep the defaults (`netlify.toml` sets publish directory `public`, no build command) and click Deploy.

## Run locally
Open `public/index.html` in a browser, or run `npx serve public`.
