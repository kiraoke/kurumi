# Kurumi

live karaoke app

## installation

clone the repo

go to client and run `npm install` 
create a `.env` file in client
fill in the following variables
```
NEXT_PUBLIC_AGORA_APP_ID=your agora app id
NEXT_PUBLIC_SERVER_URL=server url
NEXT_PUBLIC_SOCKET_URL=socket url
```

the client app runs on port 3000 by default, server on 8000 and socket at 4000

now go to server directory
run `deno install` (yes im using deno instead of node because its just better)

create a .env file in server directory
fill following variables
```
GOOGLE_CLIENT_ID=your oauth google client id
GOOGLE_CLIENT_SECRET=your oauth google client secret
SERVER_ROOT_URL=on which host server is running
CLIENT_URL=on which host client is running
PORT=server port, by default 8000
REDIS_HOST=hostname of where reddit is running
REDIS_PORT=port of reddit instance
POSTGRES_URL=the connection string to postgres instance
```

im using podman to host redis locally, you can host wherever you want.

im using postgres from supabase, as i dont want to install postgres

in postgres create a users table like this
```
CREATE TABLE users (
   user_id TEXT NOT NULL,
   email TEXT NOT NULL,
   username TEXT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   pfp TEXT,
   PRIMARY KEY (user_id, email)
);
```

## run
in client `npm run dev`
in server `deno task dev`
and `deno task dev-socket`
ik not to use dev build for prod, but im too lazy rn, so deal with it

open the client by default it will be on `localhost:3000`

## features
### client
- home page, landing page where auth happens, redirects to /player if logged in
- /player you can join meetings
- /room this is where meeting happens
- there is an AuthProvider component, which fetches user on first render and refreshes accessToken every 10 mins, to prevent expiration.
- there is a Protected component, which redirects to home if not logged in
- for conferencing shit, there is Agora.tsx for managing agora shit along with a bunch of listeners in listeners.ts
- there is Conference.tsx where the ui for room is
- i made a useSocket hook to handle socket connection and listeners
- im using `jotai` for global state
 
### server
- uses deno and hono for api
- serves music files on /static
- provides, auth and search functionality
- in auth it creates a google redirect url, redirects to it, then on success it sends accessToken to client and sets refreshToken
- search is basically just a json with list of music
- uses redis to store refreshToken sessions
- uses postgres to store users information

### socket
- uses socket.io
- user joins a room
- verifies user on connection using access token
- it is mainly used to share the state of current playing music track


## what i did
you can sign in with google, i actually implemented a refresh token and access token based auth system. where refresh token is stored in an http only cookie and access token, is stored in memory. this prevents csrf, and also xss as javascript can't access http only cookies.

the traditional jwt based implementation is vulnerable to xss. also it allows me to sign in to my socket server too without much difficulty, i just need to check if access token is valid. I dont validate accessToken on each socket event tho, only on connection. So if attacker smh got access during a call, he might gain full access to call, but he wont be able to do much damage, so i think it's a decent tradeoff for lack of complexity. I think it is pretty secure on a modern browser, where same origin policy is strictly followed. if you're using something from 2000s it can be vulnerable to csrf on refresh token endpoint. not sure havent tried to penetrate test it.

after signing in it leads to the player page, where you were supposed to update your username and pfp. But i couldn't find a decent cdn so it doesnt work. in bottom you can host a meeting or join one. The room will be your email. no it can't be changed. design choice.

the user with the email same as the roomId will be the host of that room. only host can control music. and there can be only one host. 

for web conferencing shit im using agora sdk, this is the only part of my app i dont like. I initially tried to implement a selective forwarding unit, but gave up, it's too complex and can be a project on it's own.

for music streaming, um in the task doc it was written to use yt api. but yt api doesnt allow streaming. so im just hosting a bunch of flac files on my server. along with their cover images and lyrics.

the lyrics are not synced, just plain lyrics. i could have implemented if i had bit more time.

there is a sidebar search for music, ive got a list of music in json which it searches. It is only visible to host. I know shitty implementation. im not checking server side just doing it on client. so someone can spoof being host. but why would you do that, if you were here to sing music

also when someone speaks an animation plays for that user.

also the ui sucks on some places. I realized im really bad at designing, i can implement ui though. for room page, i just copied apple music(i love apple music)

i didnt feel any parts that could need caching. it's mostly auth, which i dont want to cache because security.


also i just saw that i had to make a readme, for each folder? anyway
