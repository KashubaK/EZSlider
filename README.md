# EZSlider

Zero-dependencies, smooth animations, easy usage. All written in TypeScript.

## Installation

Currently, we only support installing the node module:

`npm install @kashuab/ez-slider`

### Usage

Add `data-ez-slider` to the parent element of your slides:

```html
<div class="slider" data-ez-slider>
  <div class="slide" style="background-image: url(https://placekitten.com/3840/2160);"></div>
  <div class="slide" style="background-image: url(https://placekitten.com/3840/2160);"></div>
  <div class="slide" style="background-image: url(https://placekitten.com/3840/2160);"></div>
</div>
```

In your JS:

```javascript
import '@kashuab/ez-slider';

const ezSlider = new EZSlider();
```

The `EZSlider` class will look for elements with the `data-ez-slider` attribute and attach to them.

All done!