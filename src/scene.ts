///<reference path="ButtonInterface.ts"/>
///<reference path="ReelInterface.ts"/>

const canvasWidth = 1280;
const canvasHeight = 720;

class ImagesConfig {
    public static readonly backgroundImage = "./resources/bg.jpg";
    public static readonly spinImage = './resources/spin.png';
    public static readonly symbolsImages = [
        './resources/diamond.png',
        './resources/heart.png',
        './resources/spade.png',
        './resources/club.png',
    ];

    public static resourcesList() {
        const result = [].concat(
            ImagesConfig.backgroundImage,
            ImagesConfig.spinImage,
            ImagesConfig.symbolsImages
        );
        return result;
    }
}

enum SymbolType {
    DIAMOND,
    HEART,
    SPADE,
    CLUB
}

enum StateEnum {
    ENABLED,
    DISABLED
}

class State implements IState {
    public static readonly ENABLED: State = new State(StateEnum.ENABLED);
    public static readonly DISABLED: State = new State(StateEnum.DISABLED);
    state: StateEnum;

    constructor(state: StateEnum) {
        this.state = state;
    }
}

class StateMachine implements IStateMachine {
    private _currentState: IState;

    public setState(state: IState) {
        this._currentState = state;
    }

    public getCurrentState() {
        return this._currentState;
    }

    public dispose(): void {
        this._currentState = null;
    }
}

class Scene {
    private _background: PIXI.Sprite;
    private _spinButton: IButton;
    private _reel: IReel;
    private readonly onScreen: number = 3;
    private readonly reelSize: number = 100;
    private readonly spinDelay: number = 2000;

    constructor() {

    }

    public init(): void {
        this.drawBackground();
        this.drawReel();
        this.drawButton();
    }

    private drawReel(): void {
        this._reel = new Reel(this.onScreen, this.reelSize, this.spinDelay);
        this._reel.init();
        this._reel.x = canvasWidth / 2 - 77;
        this._reel.y = 111;

        stage.addChild(this._reel);
        this._reel.on('onStopReel', this.onStop, this);
        this._reel.on('onWinStart', this.onStartWinAnimation, this);
        this._reel.on('onWinComplete', this.onCompleteWinAnimation, this);
    }

    private onStartWinAnimation(): void {
        this._spinButton.disable();
    }

    private onCompleteWinAnimation(): void {
        this._spinButton.enable();
    }

    private onStop(): void {
        this._spinButton.enable();
    }


    private drawBackground(): void {
        this._background = new PIXI.Sprite();
        this._background.texture = PIXI.loader.resources[ImagesConfig.backgroundImage].texture;
        stage.addChild(this._background);
    }

    private drawButton(): void {
        this._spinButton = new SimpleButton();
        this._spinButton.texture = PIXI.loader.resources[ImagesConfig.spinImage].texture;
        this._spinButton.setOnClick(this.onClick, this);
        this._spinButton.init();
        this._spinButton.x = canvasWidth / 2 + 150;
        this._spinButton.y = canvasHeight / 2 - 50;
        stage.addChild(this._spinButton);
    }

    private onClick(self: Scene): void {
        if (self._spinButton.getState() === State.DISABLED) {
            return;
        }
        self._spinButton.disable();
        self._reel.restart();
        self._reel.startSpin();
    }
}

class Symbol extends PIXI.Sprite {
    private _type: SymbolType;
    private _stateMachine: StateMachine;
    private _tween: Tween;
    private readonly _delay: number = 1000;
    public static readonly types: Array<SymbolType> = [
        SymbolType.DIAMOND,
        SymbolType.HEART,
        SymbolType.SPADE,
        SymbolType.CLUB
    ];

    constructor(type: SymbolType) {
        super();
        this._type = type;
        this._stateMachine = new StateMachine();
        this._stateMachine.setState(State.DISABLED);
        this.visible = false;
        this.texture = this.getTexture();
    }

    private getTexture(): PIXI.Texture {
        return PIXI.loader.resources[ImagesConfig.symbolsImages[this._type]].texture;
    }

    public getType(): SymbolType {
        return this._type;
    }

    public enable(): void {
        if (this._stateMachine.getCurrentState() === State.ENABLED)
            return;
        this._stateMachine.setState(State.ENABLED);
        this.visible = true;
    }

    public disable(): void {
        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this._stateMachine.setState(State.DISABLED);
        this.visible = false;
    }

    public startWinAnimation(): void {
        this._tween = new Tween();
        this._tween.setOnUpdate(this.rotate, this);
        this._tween.setOnComplete(this.onRotate, this);
        this._tween.start(this._delay);
    }

    private rotate(value: number, self: Symbol): void {
        self.rotation = value * 2 * Math.PI;
    }

    private onRotate(self: Symbol): void {
        self.emit('onWinComplete');
    }

    public dispose(): void {
        if (this._stateMachine)
            this._stateMachine.dispose();
        this._stateMachine = null;
        this.texture = null;
        this.removeChildren();
    }
}

class Tween {
    private _progress: number;
    private _onComplete: Function;
    private _onCompleteContext: any;
    private _onUpdate: Function;
    private _onUpdateContext: any;
    private _delay: number;
    private _ease: Function;

    constructor() {
        this._progress = 0;
    }

    public start(delay: number): void {

        this._delay = delay;
        app.ticker.add(this.update, this);
        if (this._ease == null)
            this._ease = this.linear;
    }

    private linear(value: number): number {
        return value;
    }

    public setEase(ease: Function): void {
        this._ease = ease;
    }

    private update(delta: number): void {
        let deltaTime: number = (delta * 1000) / app.ticker.FPS; //  because calculations are done in milliseconds
        this._progress += this._ease(deltaTime / this._delay);
        if (this._progress > 1) {
            this._progress = 1;
            this.onUpdate();
            this.onComplete();
            this.stop();
        } else {
            this.onUpdate();
        }
    }

    public onUpdate(): void {
        if (this._onUpdate != null) {
            this._onUpdate(this._progress, this._onUpdateContext);
        }
    }

    public onComplete(): void {
        if (this._onComplete != null) {
            this._onComplete(this._onCompleteContext);
        }
    }

    public setOnUpdate(onUpdate: Function, context: any): void {
        this._onUpdate = onUpdate;
        this._onUpdateContext = context;
    }

    public setOnComplete(onComplete: Function, context: any): void {
        this._onComplete = onComplete;
        this._onCompleteContext = context;
    }

    public stop(): void {
        app.ticker.remove(this.update, this);
    }
}

class Reel extends PIXI.Sprite implements IReel {
    private _stateMachine: StateMachine;
    private _symbols: Array<Symbol> = new Array<Symbol>();
    private readonly _size: number;
    private readonly _onScreen: number;
    private _currentIndex: number;
    private _tween: Tween;
    private _delay: number;
    private _winComplete: number;

    constructor(onScreen: number, size: number, spinDelay: number) {
        super();
        this._onScreen = onScreen;
        this._size = size;
        this._delay = spinDelay;
    }

    public init(): void {
        this._currentIndex = 0;
        this._stateMachine = new StateMachine();
        this._stateMachine.setState(State.DISABLED);
        this.generateSymbols();
        this.draw();
    }

    public restart(): void {
        this.removeSymbols();
        this.generateSymbols();
        this.draw();
    }

    private generateSymbols(): void {
        for (let i: number = 0; i < this._size; i++) {
            this._symbols.push(
                new Symbol(
                    Symbol.types[
                        this.randomInt(0, Symbol.types.length - 1)
                        ]
                )
            );
        }
    }

    private getMargin(): number {
        return 180;
    }

    private isSymbolvisible(symbol: Symbol): boolean {
        let margin: number = this.getMargin();
        if (symbol.y <= -margin || symbol.y > margin * this._onScreen)
            return false;
        return true;
    }

    private draw(): void {
        const margin: number = this.getMargin();
        for (let i: number = 0; i < this._symbols.length; i++) {
            let symbol: Symbol = this._symbols[i];
            if (i < this._onScreen)
                symbol.enable();
            else {
                symbol.disable();
            }
            this.addChild(symbol);
            symbol.y = i * margin;
        }
    }

    public startSpin(): void {
        if (this._stateMachine.getCurrentState() === State.ENABLED)
            return;
        this._stateMachine.setState(State.ENABLED);
        this._tween = new Tween();
        this._tween.setOnUpdate(this.roll, this);
        this._tween.setOnComplete(this.onStop, this);
        this._tween.start(this._delay);
    }

    private onStop(self: Reel): void {
        self.emit('onStopReel');
        if (self.isWinCombination()) {
            self.startWinAnimation();
        }
        self.stop();
    }

    private roll(progress: number, self: Reel): void {
        self._currentIndex = Math.floor((self._size - self._onScreen) * progress);
        console.log(self._currentIndex);
        let margin: number = self.getMargin();
        let startY: number = -self._currentIndex * margin;
        for (let i: number = 0; i < self._symbols.length; i++) {
            let symbol: Symbol = self._symbols[i];
            symbol.y = startY + i * margin;
            if (i >= self._currentIndex && i < (self._currentIndex + self._onScreen)) {
                symbol.enable();
                console.log(i + '   ' + self._currentIndex);
            }
            else {
                symbol.disable();
            }
        }
    }

    private startWinAnimation(): void {
        this.emit('onWinStart');
        this._winComplete = this._onScreen;
        for (let i: number = this._currentIndex; i < this._currentIndex + this._onScreen; i++) {
            let symbol: Symbol = this._symbols[i];
            symbol.once('onWinComplete', this.onWinComplete, this);
            symbol.startWinAnimation();
        }
    }

    private onWinComplete(): void {
        if (--this._winComplete == 0) {
            this.emit('onWinComplete');
        }
    }

    private isWinCombination(): boolean {
        for (let i: number = this._currentIndex; i < this._currentIndex + this._onScreen - 1; i++) {
            if (this._symbols[i].getType() !== this._symbols[i + 1].getType())
                return false;
        }
        return true;
    }

    private stop(): void {
        if (this._tween)
            this._tween.stop();
        this._tween = null;
        this._stateMachine.setState(State.DISABLED);
    }

    private removeSymbols(): void {
        while (this._symbols.length) {
            let value: Symbol = this._symbols.shift();
            value.dispose();
            if (value.parent)
                value.parent.removeChild(value);
        }
    }

    private randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public dispose(): void {
        stop();
    }
}

class SimpleButton extends PIXI.Sprite implements IButton {

    private _onClick: Function;
    private _clickArgs: any;
    private _stateMachine: StateMachine;
    private readonly onOverFilter: PIXI.filters.ColorMatrixFilter = new PIXI.filters.ColorMatrixFilter();
    private readonly onDisabledFilter: PIXI.filters.ColorMatrixFilter = new PIXI.filters.ColorMatrixFilter();

    constructor() {
        super();
        this._stateMachine = new StateMachine();
        this.onDisabledFilter.brightness(0.7);
        this.onOverFilter.brightness(0.9);
    }

    public setOnClick(callback: Function, args: any): void {
        this._onClick = callback;
        this._clickArgs = args;
    }

    public init(): void {
        this.hitArea = new PIXI.Rectangle(0, 0, 269, 114);
        this._stateMachine.setState(State.ENABLED);
        this.interactive = true;
        this.on('click', this.onClick)
            .on('mouseout', this.onOut)
            .on('mouseover', this.onOver);

    }

    public getState(): State {
        return this._stateMachine.getCurrentState();
    }

    public enable(): void {
        if (this._stateMachine.getCurrentState() === State.ENABLED)
            return;
        this._stateMachine.setState(State.ENABLED);
        this.filters = null;
    }

    public disable(): void {
        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this._stateMachine.setState(State.DISABLED);
        this.filters = [this.onDisabledFilter];
    }

    private onOver(): void {

        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this.filters = [this.onOverFilter];
    }

    private onOut(): void {
        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this.filters = [];

    }

    private onClick(): void {
        if (this._onClick != null)
            this._onClick(this._clickArgs);
    }

    public dispose(): void {
        this.interactive = false;
        this.removeChildren();
        this.texture = null;
        this._onClick = null;
        this._clickArgs = null;
        if (this._stateMachine)
            this._stateMachine.dispose();
        this._stateMachine = null;
        this.off('click', this.onClick);

    }
}

const renderer = PIXI.autoDetectRenderer(canvasWidth, canvasHeight);
const app = new PIXI.Application();
document.body.appendChild(renderer.view);
const stage = app.stage;
stage.interactive = true;
stage.hitArea = new PIXI.Rectangle(0, 0, canvasWidth, canvasHeight);
renderer.render(stage);

PIXI.loader
    .add(ImagesConfig.resourcesList())
    .load(setup);

var mainScene: Scene;

function setup() {
    mainScene = new Scene();
    mainScene.init();
    requestAnimationFrame(draw);
}

function draw() {
    renderer.render(stage);
    requestAnimationFrame(draw);
}