interface SliderProps {
  container: Element
  triggerThreshold?: number
  transitionDuration?: number
  transitionTimingFunction?: string
}

export default class Slider {
  container: Element
  slides: Element[]
  slideTrack: HTMLDivElement

  status: string
  currentPositionX: number
  currentPositionY: number
  activeSlideIndex: number
  slideTriggerThreshold: number
  slideWidth: number
  transitionProperty = 'transform'
  transitionDuration: number
  transitionTimingFunction: string
  trackTransitionRemovalTimeout: any

  constructor(opts: SliderProps) {
    this.container = opts.container;
    this.slides = Array.from(this.container.children);
    this.slideTrack = this.getSlideTrack();
    this.status = '';
    this.slideWidth = this.slides[0].clientWidth;

    this.currentPositionX = 0;
    this.currentPositionY = 0;
    this.activeSlideIndex = 0;

    this.transitionDuration = opts.transitionDuration || 600;
    this.transitionTimingFunction = opts.transitionTimingFunction || 'cubic-bezier(0.230, 1.000, 0.320, 1.000)';
    this.slideTriggerThreshold = opts.triggerThreshold || 200;

    this.addSlideTrack();
    this.listenForSlideTrackEvents();
  }

  neutralPositionAtCurrentSlide() {
    return this.slideWidth * -this.activeSlideIndex;
  }

  listenForSlideTrackEvents() {
    this.slideTrack.addEventListener('mousedown', (e: MouseEvent) => this.handleTrackMouseDown(e));
    this.slideTrack.addEventListener('mouseup', (e: MouseEvent) => this.handleTrackMouseUp(e));
    this.slideTrack.addEventListener('mousemove', (e: MouseEvent) => this.handleTrackMouseMove(e));
  }

  handleTrackMouseDown(e: MouseEvent) {
    this.status = 'mousedown';

    console.log(e)
    this.setLeftToCurrentTrackPosition();
    this.removeTrackTransition();
  }

  handleTrackMouseUp(e: MouseEvent) {
    this.status = 'mouseup';

    if (Math.abs(this.currentPositionX - this.neutralPositionAtCurrentSlide()) >= this.slideTriggerThreshold) {
      if (this.currentPositionX - this.neutralPositionAtCurrentSlide() > 0) {
        if (this.activeSlideIndex > 0) {
          this.activeSlideIndex--;
        }
      } else {  
        if (this.activeSlideIndex + 1 < this.slides.length) {
          this.activeSlideIndex++;
        }
      }
    }

    this.handleSlideTrigger();
  }

  handleSlideTrigger() {
    this.currentPositionX = this.neutralPositionAtCurrentSlide();
    this.setTrackTransition();
    this.setTrackPosition();

    clearTimeout(this.trackTransitionRemovalTimeout);
    this.trackTransitionRemovalTimeout = setTimeout(() => {
      this.removeTrackTransition();
    }, this.transitionDuration)
  }

  setLeftToCurrentTrackPosition() {
    this.currentPositionX = this.slideTrack.getBoundingClientRect().left;
    this.setTrackPosition();
  }

  setTrackTransition() {
    this.slideTrack.style.setProperty('transition', `${this.transitionProperty} ${this.transitionDuration}ms ${this.transitionTimingFunction}`)
  }

  removeTrackTransition() {
    this.slideTrack.style.setProperty('transition', 'none');
  }

  handleTrackMouseMove(e: MouseEvent) {
    if (this.status != 'mousedown') return;

    this.currentPositionX += e.movementX;
    this.currentPositionY += e.movementY;

    this.setTrackPosition();
  }

  setTrackPosition() {
    this.slideTrack.style.setProperty(this.transitionProperty, `translateX(${this.currentPositionX}px)`);
  }

  getSlideTrack(): HTMLDivElement {
    const track = document.createElement('div');
    track.className = "ez-slider-track";

    return track;
  }

  addSlideTrack() {
    while (this.slides.length > 0) {
      const slide = this.slides.shift();

      slide.parentElement.removeChild(slide);
      this.slideTrack.appendChild(slide);
    }

    this.container.appendChild(this.slideTrack);
    this.slides = Array.from(this.container.children[0].children);
  }
}