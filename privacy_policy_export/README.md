# Privacy Policy Hosting Instructions

This folder contains a simple Privacy Policy for **HyperTap Blitz**.

Follow these steps to publish this policy and use it on the Play Store:

## 1. Upload to GitHub

1. Create a new **Public** repository on your GitHub account (e.g., `hypertap-blitz-privacy`).
2. Upload all files in this folder (`index.html` and `app-ads.txt`) to that repository.

## 2. Enable GitHub Pages

1. Go to the **Settings** tab of your repository.
2. Click on **Pages** in the left menu.
3. Under **Build and deployment**, select `Deploy from a branch` as the **Source**.
4. Select `main` (or `master`) as the **Branch**, select the `/ (root)` folder, and click **Save**.

## 3. Get the Link

After a few minutes, you will see a link at the top of the page like this:
`https://[your-username].github.io/hypertap-blitz-privacy/`

## 4. Use on Play Store

Copy this link and paste it into the **App Content** > **Privacy Policy** section in the Google Play Console.

---
**Note:** Don't forget to open `index.html` with a text editor and change the email address at the bottom (`mtgsoftworks@gmail.com`) if needed!

## Alternative: Publish with Netlify

If you prefer using Netlify instead of GitHub Pages, use these settings:

- **Base directory:** `/` (or leave empty)
- **Build command:** (Leave empty)
- **Publish directory:** `/` (or leave empty)
- **Functions directory:** (Leave empty)

These settings allow you to publish your static HTML file directly.
