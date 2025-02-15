# vite-plugin-anyframe

TenoxUI and AnyFrame integration on vitejs.

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
  // see: https://github.com/anyframe-org/core?tab=readme-ov-file#configuration-options
  property: {
    bg: 'background'
  },
  apply: {
    body: 'bg-red'
  }
  // ... other configuration here
}
```

And finally, inside your `main.js` file :

```javascript
import 'virtual:anyframe.css'
```

And done! You can start writing your TenoxUI classes. For example :

```html
<div class="bg-red [width,height]-200px"></div>
```

Output :

```
.bg-red { background: red }
.\[width\,height\]-200px { width: 200px; height: 200px }
```

That's all you need!
