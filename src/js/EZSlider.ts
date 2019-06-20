import Slider from './Slider';

interface EZSliderProps {
  
}

export default class EZSlider {
  sliders: Slider[]

  constructor(opts: EZSliderProps) {
    this.sliders = [];

    this.initSliders();
  }

  initSliders(): void {
    const sliders = Array.from(document.querySelectorAll('[data-ez-slider]'));

    sliders.forEach(slider => {
      const triggerThreshold = parseInt(slider.getAttribute('data-ez-threshold'));
      const transitionDuration = parseInt(slider.getAttribute('data-ez-transition-duration'));
      const transitionTimingFunction = slider.getAttribute('data-ez-transition-timing');
      
      const sliderInstance = new Slider({
        container: slider,
        triggerThreshold,
        transitionDuration,
        transitionTimingFunction
      });
      
      this.sliders.push(sliderInstance);
    })
  }
}