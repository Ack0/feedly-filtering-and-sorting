var exported = {};

export function $id(id) {
    return $('#' + id);
}

interface MarkupBinding {
    name: string, value: any
}

export function bindMarkup(html: string, bindings: MarkupBinding[]): string {
    bindings.forEach(binding => {
        html = html.replace(new RegExp("\{\{" + binding.name + "\}\}", "g"), "" + binding.value);
    });
    return html;
}

export function callbackBind(thisArg: any): (callback: (...args: any[]) => any) => any {
    return (function(callback: () => any) {
        return callback.bind(this);
    }).bind(thisArg);
}
