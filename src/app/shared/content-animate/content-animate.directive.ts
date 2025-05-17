import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { animate, AnimationBuilder, AnimationPlayer, style } from '@angular/animations';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Directive({
	selector: '[contentAnimate]'
})
export class ContentAnimateDirective implements OnInit, OnDestroy {

	player!: AnimationPlayer;

	private events!: Subscription;

	constructor(
		private el: ElementRef,
		private router: Router,
		private animationBuilder: AnimationBuilder) {
	}

	ngOnInit(): void {
		this.initAnimate();
		this.events = this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.player.play();
			}
		});
	}

	ngOnDestroy(): void {
		this.events.unsubscribe();
		this.player.destroy();
	}

	initAnimate() {
		this.player = this.animationBuilder
			.build([
				style({opacity: 0, transform: 'translateY(15px)'}),
				animate(500, style({opacity: 1, transform: 'translateY(0)'})),
				style({transform: 'none'}),
			])
			.create(this.el.nativeElement);
	}
}
