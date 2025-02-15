# vite-plugin-anyframe

## Installation

```bash
npm i vite-plugin-anyframe @anyframe/core -D
```

## Usage

In your `vite.config.js` file :

```javascript
import ViteAnyFrame from 'vite-plugin-anyframe'

export default {
  plugins: [ViteAnyFrame()]
}
```

Defining config inside `anyframe.config.js` file :

```javascript
export default {
  property:{
    bg:"background"
  },
  apply:{
    body: "bg-red"
  }
}
```

And finally, inside your `main.js` file :

```javascript
import 'virtual:anyframe.css'
```