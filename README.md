# JSDance

Final project for Graphics and Visualization 50.017 module. A man who dances. Powered by (three)JS.

**TODO**
1. Implement Dual-Quaternion Skinning
2. Implement Inverse Kinematics
3. Implement parameter modulation with music

## Setup

```shell
npm install
```

## Build and Run
To build and serve the webpack bundle:

```shell
npm run build && npm run serve
```

(This writes `build/bundle.js` to disk and runs `http-server` to serve the files).

For a server with hot module reloading, run:

```shell
npm run start
```

and visit `localhost:8080/bundle` (this runs the webpack-dev-server). Note that the bundle file will not be written to disk in this case.
