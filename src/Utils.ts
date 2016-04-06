
export class CallbackFactory {
    owner: any;
    constructor(owner: any) {
        this.owner = owner;
    }
    get(method: () => any) {
        return function() {
            method.apply(this.owner, $(this));
        }
    }
}
