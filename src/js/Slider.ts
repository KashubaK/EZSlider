interface SliderProps {
  container: Element
  triggerThresholdPercent?: number
  transitionDuration?: number
  transitionTimingFunction?: string
}

export default class Slider {
  container: Element
  slides: Element[]
  slideTrack: HTMLDivElement

  mobile: boolean
  status: string
  currentPositionX: number
  currentPositionY: number
  activeSlideIndex: number
  slideTriggerThresholdPercent: number
  slideWidth: number
  transitionProperty = 'transform'
  transitionDuration: number
  transitionTimingFunction: string
  trackTransitionRemovalTimeout: any
  resizeHandlerTimeout: any

  mouseDraggedX: number
  mouseDraggedY: number
  movementX: number
  movementY: number
  previousMouseX: number
  previousMouseY: number

  constructor(opts: SliderProps) {
    this.container = opts.container;
    this.slides = Array.from(this.container.children);
    this.slideTrack = this.getSlideTrack();
    this.status = '';
    this.slideWidth = this.slides[0].clientWidth;

    this.mouseDraggedX = 0;
    this.mouseDraggedY = 0;
    this.currentPositionX = 0;
    this.currentPositionY = 0;
    this.activeSlideIndex = 0;

    this.transitionDuration = opts.transitionDuration || 600;
    this.transitionTimingFunction = opts.transitionTimingFunction || 'cubic-bezier(0.230, 1.000, 0.320, 1.000)';
    this.slideTriggerThresholdPercent = opts.triggerThresholdPercent || 10;
  
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.movementX = 0;
    this.movementY = 0;

    this.addSlideTrack();
    this.listenForSlideTrackEvents();
    this.listenForWindowEvents();
  }

  listenForWindowEvents() {
    window.addEventListener('resize', (e: UIEvent) => {
      this.calculateSlideWidth();
    });

    window.addEventListener('mouseout', (e: MouseEvent) => {
      if (e.toElement == null && e.relatedTarget == null) {
        this.handleTrackMouseUp(e);
      }
    });
  }

  calculateSlideWidth() {
    this.slideWidth = this.slides[0].clientWidth;
    this.handleSlideTrigger();
  }

  neutralPositionAtCurrentSlide() {
    return this.slideWidth * -this.activeSlideIndex;
  }

  listenForSlideTrackEvents() {
    this.container.addEventListener('mousedown', (e: MouseEvent) => this.handleTrackMouseDown(e));
    this.container.addEventListener('touchstart', (e: MouseEvent) => this.handleTrackMouseDown(e));
    this.container.addEventListener('mouseup', (e: MouseEvent) => this.handleTrackMouseUp(e));
    this.container.addEventListener('touchend', (e: MouseEvent) => this.handleTrackMouseUp(e));
    this.container.addEventListener('mousemove', (e: MouseEvent) => this.handleTrackMouseMove(e));
    this.container.addEventListener('touchmove', (e: MouseEvent) => this.handleTrackMouseMove(e));
  }

  handleTrackMouseDown(e: MouseEvent) {
    this.status = 'mousedown';

    this.setLeftToCurrentTrackPosition();
    this.removeTrackTransition();
  }

  slideTriggerThresholdAsPixels() {
    return this.slideWidth * (this.slideTriggerThresholdPercent / 100);
  }
  
  getActiveDirection() {
    return this.currentPositionX - this.neutralPositionAtCurrentSlide() > 0 ? 'right' : 'left';
  }

  hasDraggedPastTriggerThreshold() {
    const triggerThresholdAsPixels = this.slideTriggerThresholdAsPixels();

    return Math.abs(this.mouseDraggedX) > triggerThresholdAsPixels && Math.abs(this.currentPositionX - this.neutralPositionAtCurrentSlide()) >= triggerThresholdAsPixels;
  }

  handleTrackMouseUp(e: MouseEvent) {
    this.status = 'mouseup';

    this.previousMouseX = 0;
    this.previousMouseY = 0;

    if (this.hasDraggedPastTriggerThreshold()) {
      if (this.getActiveDirection() == 'right') {
        if (this.activeSlideIndex > 0) {
          this.activeSlideIndex--;
        }
      } else {  
        if (this.getActiveDirection() == 'left') {
          this.activeSlideIndex++;
        }
      }
    }

    this.mouseDraggedX = 0;
    this.mouseDraggedY = 0;

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

  getScreenX(e: MouseEvent) {
    if (e instanceof TouchEvent) {
      return e.touches[0].screenX;
    }

    return e.screenX;
  }

  getScreenY(e: MouseEvent) {
    if (e instanceof TouchEvent) {
      return e.touches[0].screenY;
    }

    return e.screenY;
  }

  setMouseMovement(e: MouseEvent) {
    const screenX = this.getScreenX(e);
    const screenY = this.getScreenY(e);

    this.movementX = this.previousMouseX != 0 ? screenX - this.previousMouseX : 0;
    this.movementY = this.previousMouseY != 0 ? screenY - this.previousMouseY : 0;

    this.previousMouseX = screenX;
    this.previousMouseY = screenY;
  }

  handleTrackMouseMove(e: MouseEvent) {
    if (this.status != 'mousedown') return;
    if (e instanceof TouchEvent) e.preventDefault();

    this.setMouseMovement(e);

    this.mouseDraggedX += this.movementX;
    this.mouseDraggedY += this.movementY;
    this.currentPositionX += this.movementX;
    this.currentPositionY += this.movementY;

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