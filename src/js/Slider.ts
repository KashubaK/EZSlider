interface SliderProps {
  container: Element
  triggerThresholdPercent?: number
  transitionDuration?: number
  transitionTimingFunction?: string
}

interface SliderEventListeners {
  slideChange?: Function[]
  slidePositionChange?: Function[]
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

  eventListeners: SliderEventListeners
  lastReportedTrackPosition: number
  listeningToTrackPosition: boolean
  
  constructor(opts: SliderProps) {
    this.container = opts.container;
    this.container['ezSlider'] = this;

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

    this.eventListeners = {
      slidePositionChange: [],
      slideChange: []
    };

    this.addSlideTrack();
    this.listenForSlideTrackEvents();
    this.listenForWindowEvents();
  }

  on(eventName: string, callback: Function) {
    switch (eventName) {
      case 'slidePositionChange':
        this.addSlidePositionChangeListener(callback);
        break;
      case 'slideChange':
        this.addSlideChangeListener(callback);
        break;
      default:
        console.info(`[EZSlider.on] Event '${eventName}' not implemented, defaulting to addEventListener on container`)
        this.container.addEventListener(eventName, callback as EventListener);
        break;
    }
  }

  addSlideChangeListener(callback: Function) {
    this.eventListeners.slideChange.push(callback);
  }

  fireEventListeners(eventName: string, data) {
    this.eventListeners[eventName].forEach(callback => callback(data));
  }
 
  addSlidePositionChangeListener(callback: Function) {
    this.eventListeners.slidePositionChange.push(callback);
    if (this.listeningToTrackPosition) return;

    this.listeningToTrackPosition = true;

    const tick = () => {
      const trackPosition = this.getTrackLeftPosition() - this.neutralPositionAtCurrentSlide();

      window.requestAnimationFrame(() => {
        if (this.lastReportedTrackPosition !== trackPosition) {
          this.lastReportedTrackPosition = trackPosition;
          this.fireEventListeners('slidePositionChange', this.lastReportedTrackPosition);
        }
      });

      window.requestAnimationFrame(tick);
    }

    tick();
  }

  setCurrentSlide(slideIndex: number) {
    if (!this.slides[slideIndex]) throw new Error(`[EZSlider.setCurrentSlide] Cannot find slide using provided slideIndex '${slideIndex}'`);

    this.activeSlideIndex = slideIndex;
    this.handleSlideTrigger();
    this.fireEventListeners('slideChange', this.activeSlideIndex);
  }

  nextSlide() {
    if (this.activeSlideIndex + 1 != this.slides.length) {
      this.setCurrentSlide(this.activeSlideIndex + 1);
      this.handleSlideTrigger();
    } else {
      console.warn('[EZSlider.nextSlide] nextSlide called when already at last slide');
    }
  }

  previousSlide() {
    if (this.activeSlideIndex > 0) {
      this.setCurrentSlide(this.activeSlideIndex - 1);
      this.handleSlideTrigger();
    } else {
      console.warn('[EZSlider.previousSlide] previousSlide called when already at first slide');
    }
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

  neutralPositionAtCurrentSlide(): number {
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

  slideTriggerThresholdAsPixels(): number {
    return this.slideWidth * (this.slideTriggerThresholdPercent / 100);
  }
  
  getActiveDirection(): string {
    return this.currentPositionX - this.neutralPositionAtCurrentSlide() > 0 ? 'right' : 'left';
  }

  hasDraggedPastTriggerThreshold(): boolean {
    const triggerThresholdAsPixels = this.slideTriggerThresholdAsPixels();

    return Math.abs(this.mouseDraggedX) > triggerThresholdAsPixels && Math.abs(this.currentPositionX - this.neutralPositionAtCurrentSlide()) >= triggerThresholdAsPixels;
  }

  handleTrackMouseUp(e: MouseEvent) {
    this.status = 'mouseup';

    this.previousMouseX = 0;
    this.previousMouseY = 0;

    if (this.hasDraggedPastTriggerThreshold()) {
      if (this.getActiveDirection() == 'right') {
        this.previousSlide();
      } else if (this.getActiveDirection() == 'left') {  
        this.nextSlide();
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

  getTrackLeftPosition(): number {
    return this.slideTrack.getBoundingClientRect().left;
  }

  setLeftToCurrentTrackPosition() {
    this.currentPositionX = this.getTrackLeftPosition();
    this.setTrackPosition();
  }

  setTrackTransition() {
    this.slideTrack.style.setProperty('transition', `${this.transitionProperty} ${this.transitionDuration}ms ${this.transitionTimingFunction}`)
  }

  removeTrackTransition() {
    this.slideTrack.style.setProperty('transition', 'none');
  }

  getScreenX(e: MouseEvent): number {
    if (e instanceof TouchEvent) {
      return e.touches[0].screenX;
    }

    return e.screenX;
  }

  getScreenY(e: MouseEvent): number {
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