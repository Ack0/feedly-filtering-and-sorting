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

export function capitalizeFirst(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function registerAccessors(srcObject, srcFieldName: string, targetPrototype, setterCallback: (t) => void, setterCallbackThisArg: Object, fieldObjectName?: string) {
    console.log("registerAccessors: " + JSON.stringify(srcObject));
    for (var field in srcObject) {
        var type = typeof (srcObject[field]);
        if (type === "object") {
            if ($.isArray(srcObject[field])) {
                console.log(field + ": array");
            } else {
                console.log("register object: " + field);
                registerAccessors(srcObject[field], srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, field);
            }
        } else if (type !== "function") {
            console.log("register: " + field);
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
                        console.log("get " + callbackField);
                        var finalObj = getFinalObj(this[srcFieldName])
                        var value = finalObj[callbackField];
                        console.log("value: " + value);
                        return value;
                    };
                    console.log("registered getter: " + getterName);
                }
                if (targetPrototype[setterName] == null) {
                    targetPrototype[setterName] = function (value) {
                        console.log("set " + callbackField);
                        var callbackSrcObj = this[srcFieldName];
                        var finalObj = getFinalObj(callbackSrcObj)
                        var oldValue = finalObj[callbackField];
                        finalObj[callbackField] = value;
                        console.log("value: " + value);
                        setterCallback.call(setterCallbackThisArg, callbackSrcObj);
                    };
                }
                console.log("registered setter: " + setterName);
            })();
        }
    }
}
