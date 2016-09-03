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

export function callbackBindedTo(thisArg: any): (callback: (...args: any[]) => any) => any {
    return (function (callback: () => any) {
        return callback.bind(this);
    }).bind(thisArg);
}

export function capitalizeFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isRadioChecked(input: JQuery): boolean {
    return input.is(':checked');
}

export function setRadioChecked(htmlId: string, checked: boolean) {
    $id(htmlId).prop('checked', checked);
}

export function registerAccessors(srcObject, srcFieldName: string, targetPrototype, setterCallback: (t) => void, setterCallbackThisArg: Object, fieldObjectName?: string) {
    for (var field in srcObject) {
        var type = typeof (srcObject[field]);
        if (type === "object") {
            if ($.isArray(srcObject[field])) {
            } else {
                registerAccessors(srcObject[field], srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, field);
            }
        } else if (type !== "function") {
            var accessorName = capitalizeFirst(field);
            if (fieldObjectName != null) {
                accessorName += "_" + capitalizeFirst(fieldObjectName);
            }
            var getterName = (type === "boolean" ? "is" : "get") + accessorName;
            var setterName = "set" + accessorName;
            (() => {
                var callbackField = field;
                var getFinalObj = function (callbackSrcObj) {
                    return fieldObjectName == null ? callbackSrcObj : callbackSrcObj[fieldObjectName];
                }
                if (targetPrototype[getterName] == null) {
                    targetPrototype[getterName] = function () {
                        var finalObj = getFinalObj(this[srcFieldName])
                        return finalObj[callbackField];
                    };
                }
                if (targetPrototype[setterName] == null) {
                    targetPrototype[setterName] = function (value) {
                        var callbackSrcObj = this[srcFieldName];
                        var finalObj = getFinalObj(callbackSrcObj)
                        finalObj[callbackField] = value;
                        setterCallback.call(setterCallbackThisArg, callbackSrcObj);
                    };
                }
            })();
        }
    }
}
