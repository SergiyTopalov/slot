
interface IState {
    state:any;
}

interface IStateMachine {
    setState(state:IState):void;
    getCurrentState():IState;
}