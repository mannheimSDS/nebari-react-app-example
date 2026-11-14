# Nebari React app example

A web app with a React front end for the SDS cluster at https://sdscluster.uni-mannheim.de. [Vite](https://vite.dev/) builds the React code into static files. A small Node server (`server.js`, no packages) serves those files and a read-only JSON API from an SQLite database. The page shows a quote board with a random-quote banner, search, sorting, shuffling and topic filters.

For a simpler, Python-only version, see [nebari-app-example](https://github.com/mannheimSDS/nebari-app-example).

## Deploy it on the cluster

You need a cluster account. Every step runs in your browser.

1. Log in at https://sdscluster.uni-mannheim.de and start a JupyterLab server. The smallest instance is enough.
2. In JupyterLab, open File → New → Terminal and run:

   ```bash
   cd ~
   git clone https://github.com/mannheimSDS/nebari-react-app-example.git
   cd nebari-react-app-example
   npm ci          # installs React and Vite into node_modules
   npm run build   # writes the finished site to dist/
   which node      # note this path for step 4
   ```

   The cluster image already has Node and npm. `which node` usually prints `/opt/conda/envs/default/bin/node`.
3. Optional: test it in the terminal with `node server.js 3001`. Stop it with Ctrl-C.
4. Go back to the hub home page (https://sdscluster.uni-mannheim.de/hub/home) and click "Deploy App". Fill in:
   - Name: anything, e.g. `My React App`
   - Framework: `Custom Command`
   - Custom command, with the node path from step 2 and your username:

     ```
     /opt/conda/envs/default/bin/node /home/YOURUSER/nebari-react-app-example/server.js {port}
     ```

   - Software Environment: leave empty.
   - Sharing: choose public access if people without a cluster account should see the app.
5. Click Next, choose the smallest Server Type, and deploy. After about 30 seconds the app runs at `https://sdscluster.uni-mannheim.de/user/YOURUSER/APP-NAME/`. You can stop, start, edit and delete it from the hub home page.

To ship a change: edit the code, run `npm run build` again, then stop and start the app from the hub home page. A change to `src/` only reaches the site after `npm run build`.

## Work on it

```bash
npm ci
node server.js 3001   # terminal 1: API and database
npm run dev           # terminal 2: live-reloading front end on http://localhost:5173
```

On the cluster, `npm run dev` is only useful through JupyterLab's proxy. The quicker loop there is `npm run build` and reloading the deployed app.

## How it works

1. `src/App.jsx` is the whole front end and `src/index.css` its styling. All searching, sorting and shuffling happens in the browser.
2. `server.js` serves `dist/` and one route, `api/quotes`, which returns every row as JSON. It uses only Node's built-in `node:http` and `node:sqlite` (Node 22.5 or newer).
3. On first start, `server.js` creates the SQLite file `data.db` next to itself, in your home folder, and fills it with ten quotes. The file stays there between restarts and is not committed to git.
4. After that, the server opens the database read-only and answers only GET requests. Nobody on the internet can write to it. To add rows, use a JupyterLab terminal:

   ```bash
   cd ~/nebari-react-app-example
   node -e "new (require('node:sqlite').DatabaseSync)('data.db').prepare('insert into quotes (text, author, topic) values (?, ?, ?)').run('Hello', 'Me', 'demo')"
   ```

   Reload the page to see the row.

## Rules your app must follow on Nebari

Give this section to your coding agent.

1. Read the port from the first command-line argument and listen on `0.0.0.0`. Nebari chooses the port.
2. Use relative paths everywhere. The app lives under `/user/NAME/APP/`, so `fetch('api/quotes')` works and `fetch('/api/quotes')` does not. Keep `base: './'` in `vite.config.js`. If you add client-side routing, use hash routes (`#/about`).
3. Build before deploying. Nebari serves `dist/`, so `npm run build` must run after every front-end change.
4. Keep data in files inside your home directory, such as SQLite. The app pod and your JupyterLab server share the same home.
5. A public app is open to the whole internet. Do not add routes that write to your database or files unless the app checks who is logged in. Load and edit data from JupyterLab instead.
6. Never put secrets in the repository or in the front end, since everything in `dist/` is public. Pass API keys as environment variables in the "Deploy App" form and use them only in `server.js`.
7. Each app is one container. There is no Docker and no separate database server.
8. Logs: if the app does not start, open it from the hub home page; the start-up log shows the error. The usual causes are a wrong path in the command, a missing `npm run build`, or a hard-coded port.

Background: Nebari apps are built on [jhub-apps](https://jhub-apps.nebari.dev/create-apps/general-app/). Its "Custom Command" option runs any program that serves HTTP on the given port.
