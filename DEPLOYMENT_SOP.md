# Deployment Standard Operating Procedure (SOP) – IndCric

**Version:** 1.0
**Owner:** Engineering
**Last Updated:** September 17, 2024

## 1. Purpose

This document outlines the standard procedure for deploying the IndCric Next.js application to Firebase Hosting. Following these steps ensures that every deployment is **stable, deterministic, and reproducible**, minimizing the risk of build failures (`exit code 1`), chunk loading errors, and environment-specific bugs.

---

## 2. Pre-Deployment Checklist

### Phase 1: Environment & Code Verification

These steps must be performed in your local development environment before initiating a deployment.

**2.1. Environment Check**
- **Node.js Version:** Verify you are using Node.js v18. Create a `.nvmrc` file if you use `nvm`.
  ```bash
  node -v 
  # Expected output: v18.x.x
  ```
- **Firebase CLI:** Ensure the latest version is installed and you are logged in.
  ```bash
  firebase --version
  firebase login
  ```

**2.2. Code Synchronization**
- Ensure your local branch is up-to-date with the target deployment branch (e.g., `main` or `dev`).
  ```bash
  git pull origin main
  ```

**2.3. Dependency Installation**
- Perform a clean installation of dependencies to ensure exact versions from `package-lock.json` are used. This is the most critical step for a deterministic build.
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Phase 2: Local Build & Test Validation

**2.4. Run Local Build**
- Execute the production build command to catch any errors before deployment.
  ```bash
  npm run build
  ```
- **Result:** The build must complete successfully without any errors.

**2.5. Run Automated Tests**
- Verify that all tests and type checks pass.
  ```bash
  npm test
  npm run type-check
  ```
- **Result:** Both commands must exit with code 0 (success).

---

## 3. Deployment Procedure

Once all pre-deployment checks are successful, proceed with the deployment to Firebase.

**3.1. Firebase Project Selection**
- Ensure your Firebase CLI is configured to use the correct project.
  ```bash
  firebase use <your-project-id>
  ```

**3.2. Execute Deployment**
- Deploy the application to Firebase Hosting. For debugging, use the `--debug` flag.
  ```bash
  firebase deploy --only hosting
  ```
- **Result:** The deployment process should complete successfully, showing "Deploy complete!" without any build failures.

---

## 4. Post-Deployment Validation

**4.1. Verify Live Site**
- Open the deployed site URL.
- Perform a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to bypass any local cache.
- Navigate through key pages (Home, Leaderboard, Profile) to ensure they load correctly.

**4.2. Check Console**
- Open the browser's developer console and check for any critical runtime errors.

**4.3. Version Control**
- If the deployment is successful and introduces a stable state, tag the commit in Git.
  ```bash
  git tag -a v1.2.0 -m "Stable deployment of feature X"
  git push origin v1.2.0
  ```

---

## 5. CI/CD Pipeline Integration Notes

For automated deployments (e.g., via GitHub Actions), the CI configuration should mirror these steps:

```yaml
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js v18
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm' # Use npm caching

      - name: Install Dependencies
        run: npm ci # 'ci' is faster and safer for CI environments

      - name: Build Application
        run: npm run build

      - name: Run Tests
        run: npm test

      - name: Deploy to Firebase
        run: firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
```
**Note:** `npm ci` is preferred over `npm install` in CI/CD as it uses `package-lock.json` for a faster, more reliable installation.
