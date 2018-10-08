var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var canvasWidth = 1280;
var canvasHeight = 720;
var ImagesConfig = (function () {
    function ImagesConfig() {
    }
    ImagesConfig.resourcesList = function () {
        var result = [].concat(ImagesConfig.backgroundImage, ImagesConfig.spinImage, ImagesConfig.symbolsImages);
        return result;
    };
    ImagesConfig.backgroundImage = "./resources/bg.jpg";
    ImagesConfig.spinImage = './resources/spin.png';
    ImagesConfig.symbolsImages = [
        './resources/diamond.png',
        './resources/heart.png',
        './resources/spade.png',
        './resources/club.png',
    ];
    return ImagesConfig;
}());
var SymbolType;
(function (SymbolType) {
    SymbolType[SymbolType["DIAMOND"] = 0] = "DIAMOND";
    SymbolType[SymbolType["HEART"] = 1] = "HEART";
    SymbolType[SymbolType["SPADE"] = 2] = "SPADE";
    SymbolType[SymbolType["CLUB"] = 3] = "CLUB";
})(SymbolType || (SymbolType = {}));
var StateEnum;
(function (StateEnum) {
    StateEnum[StateEnum["ENABLED"] = 0] = "ENABLED";
    StateEnum[StateEnum["DISABLED"] = 1] = "DISABLED";
})(StateEnum || (StateEnum = {}));
var State = (function () {
    function State(state) {
        this.state = state;
    }
    State.ENABLED = new State(StateEnum.ENABLED);
    State.DISABLED = new State(StateEnum.DISABLED);
    return State;
}());
var StateMachine = (function () {
    function StateMachine() {
    }
    StateMachine.prototype.setState = function (state) {
        this._currentState = state;
    };
    StateMachine.prototype.getCurrentState = function () {
        return this._currentState;
    };
    StateMachine.prototype.dispose = function () {
        this._currentState = null;
    };
    return StateMachine;
}());
var Scene = (function () {
    function Scene() {
        this.onScreen = 3;
        this.reelSize = 100;
        this.spinDelay = 2000;
    }
    Scene.prototype.init = function () {
        this.drawBackground();
        this.drawReel();
        this.drawButton();
    };
    Scene.prototype.drawReel = function () {
        this._reel = new Reel(this.onScreen, this.reelSize, this.spinDelay);
        this._reel.init();
        this._reel.x = canvasWidth / 2 - 77;
        this._reel.y = 111;
        stage.addChild(this._reel);
        this._reel.on('onStopReel', this.onStop, this);
        this._reel.on('onWinStart', this.onStartWinAnimation, this);
        this._reel.on('onWinComplete', this.onCompleteWinAnimation, this);
    };
    Scene.prototype.onStartWinAnimation = function () {
        this._spinButton.disable();
    };
    Scene.prototype.onCompleteWinAnimation = function () {
        this._spinButton.enable();
    };
    Scene.prototype.onStop = function () {
        this._spinButton.enable();
    };
    Scene.prototype.drawBackground = function () {
        this._background = new PIXI.Sprite();
        this._background.texture = PIXI.loader.resources[ImagesConfig.backgroundImage].texture;
        stage.addChild(this._background);
    };
    Scene.prototype.drawButton = function () {
        this._spinButton = new SimpleButton();
        this._spinButton.texture = PIXI.loader.resources[ImagesConfig.spinImage].texture;
        this._spinButton.setOnClick(this.onClick, this);
        this._spinButton.init();
        this._spinButton.x = canvasWidth / 2 + 150;
        this._spinButton.y = canvasHeight / 2 - 50;
        stage.addChild(this._spinButton);
    };
    Scene.prototype.onClick = function (self) {
        if (self._spinButton.getState() === State.DISABLED) {
            return;
        }
        self._spinButton.disable();
        self._reel.restart();
        self._reel.startSpin();
    };
    return Scene;
}());
var Symbol = (function (_super) {
    __extends(Symbol, _super);
    function Symbol(type) {
        var _this = _super.call(this) || this;
        _this._delay = 1000;
        _this._type = type;
        _this._stateMachine = new StateMachine();
        _this._stateMachine.setState(State.DISABLED);
        _this.visible = false;
        _this.texture = _this.getTexture();
        return _this;
    }
    Symbol.prototype.getTexture = function () {
        return PIXI.loader.resources[ImagesConfig.symbolsImages[this._type]].texture;
    };
    Symbol.prototype.getType = function () {
        return this._type;
    };
    Symbol.prototype.enable = function () {
        if (this._stateMachine.getCurrentState() === State.ENABLED)
            return;
        this._stateMachine.setState(State.ENABLED);
        this.visible = true;
    };
    Symbol.prototype.disable = function () {
        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this._stateMachine.setState(State.DISABLED);
        this.visible = false;
    };
    Symbol.prototype.startWinAnimation = function () {
        this._tween = new Tween();
        this._tween.setOnUpdate(this.rotate, this);
        this._tween.setOnComplete(this.onRotate, this);
        this._tween.start(this._delay);
    };
    Symbol.prototype.rotate = function (value, self) {
        self.rotation = value * 2 * Math.PI;
    };
    Symbol.prototype.onRotate = function (self) {
        self.emit('onWinComplete');
    };
    Symbol.prototype.dispose = function () {
        if (this._stateMachine)
            this._stateMachine.dispose();
        this._stateMachine = null;
        this.texture = null;
        this.removeChildren();
    };
    Symbol.types = [
        SymbolType.DIAMOND,
        SymbolType.HEART,
        SymbolType.SPADE,
        SymbolType.CLUB
    ];
    return Symbol;
}(PIXI.Sprite));
var Tween = (function () {
    function Tween() {
        this._progress = 0;
    }
    Tween.prototype.start = function (delay) {
        this._delay = delay;
        app.ticker.add(this.update, this);
        if (this._ease == null)
            this._ease = this.linear;
    };
    Tween.prototype.linear = function (value) {
        return value;
    };
    Tween.prototype.setEase = function (ease) {
        this._ease = ease;
    };
    Tween.prototype.update = function (delta) {
        var deltaTime = (delta * 1000) / app.ticker.FPS;
        this._progress += this._ease(deltaTime / this._delay);
        if (this._progress > 1) {
            this._progress = 1;
            this.onUpdate();
            this.onComplete();
            this.stop();
        }
        else {
            this.onUpdate();
        }
    };
    Tween.prototype.onUpdate = function () {
        if (this._onUpdate != null) {
            this._onUpdate(this._progress, this._onUpdateContext);
        }
    };
    Tween.prototype.onComplete = function () {
        if (this._onComplete != null) {
            this._onComplete(this._onCompleteContext);
        }
    };
    Tween.prototype.setOnUpdate = function (onUpdate, context) {
        this._onUpdate = onUpdate;
        this._onUpdateContext = context;
    };
    Tween.prototype.setOnComplete = function (onComplete, context) {
        this._onComplete = onComplete;
        this._onCompleteContext = context;
    };
    Tween.prototype.stop = function () {
        app.ticker.remove(this.update, this);
    };
    return Tween;
}());
var Reel = (function (_super) {
    __extends(Reel, _super);
    function Reel(onScreen, size, spinDelay) {
        var _this = _super.call(this) || this;
        _this._symbols = new Array();
        _this._onScreen = onScreen;
        _this._size = size;
        _this._delay = spinDelay;
        return _this;
    }
    Reel.prototype.init = function () {
        this._currentIndex = 0;
        this._stateMachine = new StateMachine();
        this._stateMachine.setState(State.DISABLED);
        this.generateSymbols();
        this.draw();
    };
    Reel.prototype.restart = function () {
        this.removeSymbols();
        this.generateSymbols();
        this.draw();
    };
    Reel.prototype.generateSymbols = function () {
        for (var i = 0; i < this._size; i++) {
            this._symbols.push(new Symbol(Symbol.types[this.randomInt(0, Symbol.types.length - 1)]));
        }
    };
    Reel.prototype.getMargin = function () {
        return 180;
    };
    Reel.prototype.isSymbolvisible = function (symbol) {
        var margin = this.getMargin();
        if (symbol.y <= -margin || symbol.y > margin * this._onScreen)
            return false;
        return true;
    };
    Reel.prototype.draw = function () {
        var margin = this.getMargin();
        for (var i = 0; i < this._symbols.length; i++) {
            var symbol = this._symbols[i];
            if (i < this._onScreen)
                symbol.enable();
            else {
                symbol.disable();
            }
            this.addChild(symbol);
            symbol.y = i * margin;
        }
    };
    Reel.prototype.startSpin = function () {
        if (this._stateMachine.getCurrentState() === State.ENABLED)
            return;
        this._stateMachine.setState(State.ENABLED);
        this._tween = new Tween();
        this._tween.setOnUpdate(this.roll, this);
        this._tween.setOnComplete(this.onStop, this);
        this._tween.start(this._delay);
    };
    Reel.prototype.onStop = function (self) {
        self.emit('onStopReel');
        if (self.isWinCombination()) {
            self.startWinAnimation();
        }
        self.stop();
    };
    Reel.prototype.roll = function (progress, self) {
        self._currentIndex = Math.floor((self._size - self._onScreen) * progress);
        console.log(self._currentIndex);
        var margin = self.getMargin();
        var startY = -self._currentIndex * margin;
        for (var i = 0; i < self._symbols.length; i++) {
            var symbol = self._symbols[i];
            symbol.y = startY + i * margin;
            if (i >= self._currentIndex && i < (self._currentIndex + self._onScreen)) {
                symbol.enable();
                console.log(i + '   ' + self._currentIndex);
            }
            else {
                symbol.disable();
            }
        }
    };
    Reel.prototype.startWinAnimation = function () {
        this.emit('onWinStart');
        this._winComplete = this._onScreen;
        for (var i = this._currentIndex; i < this._currentIndex + this._onScreen; i++) {
            var symbol = this._symbols[i];
            symbol.once('onWinComplete', this.onWinComplete, this);
            symbol.startWinAnimation();
        }
    };
    Reel.prototype.onWinComplete = function () {
        if (--this._winComplete == 0) {
            this.emit('onWinComplete');
        }
    };
    Reel.prototype.isWinCombination = function () {
        for (var i = this._currentIndex; i < this._currentIndex + this._onScreen - 1; i++) {
            if (this._symbols[i].getType() !== this._symbols[i + 1].getType())
                return false;
        }
        return true;
    };
    Reel.prototype.stop = function () {
        if (this._tween)
            this._tween.stop();
        this._tween = null;
        this._stateMachine.setState(State.DISABLED);
    };
    Reel.prototype.removeSymbols = function () {
        while (this._symbols.length) {
            var value = this._symbols.shift();
            value.dispose();
            if (value.parent)
                value.parent.removeChild(value);
        }
    };
    Reel.prototype.randomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    Reel.prototype.dispose = function () {
        stop();
    };
    return Reel;
}(PIXI.Sprite));
var SimpleButton = (function (_super) {
    __extends(SimpleButton, _super);
    function SimpleButton() {
        var _this = _super.call(this) || this;
        _this.onOverFilter = new PIXI.filters.ColorMatrixFilter();
        _this.onDisabledFilter = new PIXI.filters.ColorMatrixFilter();
        _this._stateMachine = new StateMachine();
        _this.onDisabledFilter.brightness(0.7);
        _this.onOverFilter.brightness(0.9);
        return _this;
    }
    SimpleButton.prototype.setOnClick = function (callback, args) {
        this._onClick = callback;
        this._clickArgs = args;
    };
    SimpleButton.prototype.init = function () {
        this.hitArea = new PIXI.Rectangle(0, 0, 269, 114);
        this._stateMachine.setState(State.ENABLED);
        this.interactive = true;
        this.on('click', this.onClick)
            .on('mouseout', this.onOut)
            .on('mouseover', this.onOver);
    };
    SimpleButton.prototype.getState = function () {
        return this._stateMachine.getCurrentState();
    };
    SimpleButton.prototype.enable = function () {
        if (this._stateMachine.getCurrentState() === State.ENABLED)
            return;
        this._stateMachine.setState(State.ENABLED);
        this.filters = null;
    };
    SimpleButton.prototype.disable = function () {
        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this._stateMachine.setState(State.DISABLED);
        this.filters = [this.onDisabledFilter];
    };
    SimpleButton.prototype.onOver = function () {
        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this.filters = [this.onOverFilter];
    };
    SimpleButton.prototype.onOut = function () {
        if (this._stateMachine.getCurrentState() === State.DISABLED)
            return;
        this.filters = [];
    };
    SimpleButton.prototype.onClick = function () {
        if (this._onClick != null)
            this._onClick(this._clickArgs);
    };
    SimpleButton.prototype.dispose = function () {
        this.interactive = false;
        this.removeChildren();
        this.texture = null;
        this._onClick = null;
        this._clickArgs = null;
        if (this._stateMachine)
            this._stateMachine.dispose();
        this._stateMachine = null;
        this.off('click', this.onClick);
    };
    return SimpleButton;
}(PIXI.Sprite));
var renderer = PIXI.autoDetectRenderer(canvasWidth, canvasHeight);
var app = new PIXI.Application();
document.body.appendChild(renderer.view);
var stage = app.stage;
stage.interactive = true;
stage.hitArea = new PIXI.Rectangle(0, 0, canvasWidth, canvasHeight);
renderer.render(stage);
PIXI.loader
    .add(ImagesConfig.resourcesList())
    .load(setup);
var mainScene;
function setup() {
    mainScene = new Scene();
    mainScene.init();
    requestAnimationFrame(draw);
}
function draw() {
    renderer.render(stage);
    requestAnimationFrame(draw);
}
//# sourceMappingURL=scene.js.map