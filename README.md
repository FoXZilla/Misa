# Misa

:motorcycle: A FireApi for FireBlog. No dependency of Database.

> Misa is not ready.

```
  _________________________________________________________
 |_________________________________________________________|
 |_______________________#_________________________________|
 |________________##____###________________________________|
 |______####_____###_______________________________________|
 |______#####___####________________##_____________________|
 |_______#####__####____###_______###_______####___________|
 |_______##_#####_##____##______##_________#__##___________|
 |_______##__###___##___##_____######_____##__##___________|
 |_______##________##___##_________#####__#___##___________|
 |_______##________###___##_________###___#__###___________|
 |_______##_________##___##___######______####_#####_______|
 |_________________________________________________________|
 |_________________________________________________________|
 |_________________________________________________________|
```

# Usage

Import a FireBlogData file:

```
npm run import out.fbd.json
```

There will import data to `/_data`, check it, and rename as `data` to enable that.

---

Run server:

```
npm run dev   # debug
npm run start # production
```

# Import  the FireBlogData

```
./bin/import.js --help
node bin/import.js --help # windows
```

# Server

```
npm start
```

Now misa support QQ and Facebook OAuth login.

## Options

### HTTPs

see `./lib/ssl/index.js`.

### Environment variables

- use http force: `SSL=false npm start`
- set server listen port: `PORT=3002 npm start`
- set FireApi url(itself): `FIREAPI=https://misa.pea3nut.org npm start`
- set FireFront url: `FIREFRONT=https://yusa.pea3nut.org npm start`, it will set CORS for `FIREFRONT`
- set proxy for OAuth: `http_proxy=127.0.0.1:8116 npm start`
- set proxy for import: `http_proxy=127.0.0.1:8116 ./bin/import.js out.fbd.json`

## Development

Misa will support the url which is FireFront not only, but also `http(s)://localhost:3003`. They have correct CORS response both. So you can use local's front-end page to visit remote's back-end.
