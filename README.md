# Nebari React app example

A web app with a React front end to deploy on a Nebari cluster. [Vite](https://vite.dev/) builds the React code into static files. A small Node server (`server.js`, no packages) serves those files and a read-only JSON API from an SQLite database. The page shows a quote board with a random-quote banner, search, sorting, shuffling and topic filters.

For a simpler, Python-only version, see [nebari-app-example](https://github.com/mannheimSDS/nebari-app-example).

## Deploy it

You need an account on the cluster. Every step runs in your browser.

1. Log in and start a JupyterLab server. The smallest instance is enough.
2. In JupyterLab, open File → New → Terminal and run:

   ```bash
   cd ~
   git clone https://github.com/mannheimSDS/nebari-react-app-example.git
   cd nebari-react-app-example
   npm ci          # installs React and Vite into node_modules
   npm run build   # writes the finished site to dist/
   which node      # note this path for step 4
   ```

3. Optional: test it in the terminal with `node server.js 3001`. Stop it with Ctrl-C.
4. Go back to the hub home page and click "Deploy App". Fill in:
   - Name: anything, e.g. `My React App`
   - Framework: `Custom Command`
   - Custom command, with the node path from step 2 and your username:

     ```
     NODE_PATH_FROM_STEP_2 /home/YOURUSER/nebari-react-app-example/server.js {port}
     ```

   - Software Environment: leave empty.
   - Sharing: choose public access only if people without an account must see the app.
5. Click Next, choose the smallest Server Type, and deploy. After about 30 seconds the app is live. You can stop, start, edit and delete it from the hub home page.

To ship a change: edit the code, run `npm run build` again, then stop and start the app from the hub home page. A change to `src/` only reaches the site after `npm run build`.

## Work on it

```bash
npm ci
node server.js 3001   # terminal 1: API and database
npm run dev           # terminal 2: live-reloading front end on http://localhost:5173
```

On the cluster, the quicker loop is `npm run build` and reloading the deployed app.

## How it works

1. `src/App.jsx` is the whole front end and `src/index.css` its styling. All searching, sorting and shuffling happens in the browser.
2. `server.js` serves `dist/` and one route, `api/quotes`, which returns every row as JSON. It uses only Node's built-in `node:http` and `node:sqlite` (Node 22.5 or newer).
3. On first start, `server.js` creates the SQLite file `data.db` next to itself and fills it with ten quotes. The file stays there between restarts and is not committed to git.
4. After that, the server opens the database read-only and answers only GET requests. Nobody on the internet can write to it. To add rows, use a JupyterLab terminal:

   ```bash
   cd ~/nebari-react-app-example
   node -e "new (require('node:sqlite').DatabaseSync)('data.db').prepare('insert into quotes (text, author, topic) values (?, ?, ?)').run('Hello', 'Me', 'demo')"
   ```

   Reload the page to see the row.

## Rules your app must follow

Give this section to your coding agent.

1. Read the port from the first command-line argument and listen on `0.0.0.0`. Never hard-code a port.
2. Use relative paths everywhere. The app is served under a path prefix, so `fetch('api/quotes')` works and `fetch('/api/quotes')` does not. Keep `base: './'` in `vite.config.js`. If you add client-side routing, use hash routes (`#/about`).
3. Build before deploying. The server serves `dist/`, so `npm run build` must run after every front-end change.
4. Keep everything the app needs in its own folder: code, `node_modules`, `dist/` and data such as SQLite. Write full paths in the command, and do not use `cd ~` or paths relative to your home. The app sees only the folders its command names, and anything it writes elsewhere is lost when it stops.
5. A public app is open to the whole internet. Do not add routes that write to your database or files unless the app checks who is logged in. Load and edit data from JupyterLab instead. Never run a debug server.
6. Never put secrets in the repository or in the front end, since everything in `dist/` is public. Pass API keys as environment variables in the "Deploy App" form and use them only in `server.js`.
7. Logs: if the app does not start, open it from the hub home page; the start-up log shows the error. The usual causes are a wrong path in the command, a file outside the app folder, a missing `npm run build`, or a hard-coded port.
