import { Component, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css'],
})
export class LandingpageComponent {
  constructor(private renderer: Renderer2) {}

  private imageUrls: string[] = [
    '/assets/images/lp/image1.png',
    '/assets/images/lp/image2.png',
    '/assets/images/lp/image3.png',
    '/assets/images/lp/image4.png',
  ];
  private currentIndex = 0;
  private intervalId!: ReturnType<typeof setInterval>;

  targetDate = new Date('2025-01-15T00:00:00').getTime();
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  seconds: number = 0;

  ngOnInit() {
    this.loadScript('assets/js/modernizr.js');
    this.loadScript('assets/js/jquery-3.2.1.min.js');
    this.loadScript('assets/js/main.js');
    this.loadScript('assets/js/plugins.js');
    this.updateCountdown();
    setInterval(() => this.updateCountdown(), 1000);

    this.startBackgroundChange();
  }

  updateCountdown() {
    const now = new Date().getTime();
    const timeLeft = this.targetDate - now;

    this.days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    this.hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    this.minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    this.seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  }

  loadScript(url: string) {
    const script = this.renderer.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    this.renderer.appendChild(document.body, script);
  }

  private startBackgroundChange(): void {
    const backgroundElement = document.querySelector(
      '.home-slider-img'
    ) as HTMLElement;
    this.changeBackgroundImage(backgroundElement); // Imposta l'immagine iniziale

    this.intervalId = setInterval(() => {
      this.changeBackgroundImage(backgroundElement);
    }, 3000);
  }

  private changeBackgroundImage(element: HTMLElement): void {
    element.style.backgroundImage = `url('${
      this.imageUrls[this.currentIndex]
    }')`;
    this.currentIndex = (this.currentIndex + 1) % this.imageUrls.length;
  }
}
