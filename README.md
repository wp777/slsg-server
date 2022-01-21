# STV Server
This project contains SLSG server (based on https://github.com/wp777/stv-server using https://gist.github.com/0xjac/85097472043b697ab57ba1b1c7530274).

## UI development server

Run `npm run dev` for a dev server. Navigate to `http://localhost:3000/`.
## Build and full development server

Run `npm run build` to build the project.

## Deployment
```
git clone ...
# change slsgsatPath in ./src/Slsg.txt
# change port in ./src/main.ts
# ensure slsg-web is in the same directory as slsg-server
npm run build
npm run start
```
