var exported = {};
export function callbackBind(thisArg: any): (callback: (...args: any[]) => any) => any {
    return (function(callback: () => any) {
        return callback.bind(this);
    }).bind(thisArg);
}

export function $id(id) {
    return $('#' + id);
}

export function insertIndex(element: JQuery, i: number) {
    // The elemen0t we want to swap with
    var $target = element.parent().children().eq(i);

    // Determine the direction of the appended index so we know what side to place it on
    if (element.index() > i) {
        $target.before(element);
    } else {
        $target.after(element);
    }
}
