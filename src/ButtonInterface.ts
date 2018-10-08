///<reference path="StateMachineInterface.ts"/>
interface IButton extends PIXI.Sprite {
    getState():IState;

    setOnClick(callback: Function, args: any): void;

    init(): void;

    enable(): void;

    disable(): void;
}
