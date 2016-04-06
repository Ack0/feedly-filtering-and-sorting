/// <reference path="./_references.d.ts" />

declare var uneval: any;

export class DAO {
    path: string;
    
    constructor(path: string) {
        this.path = path;
    }
    deserializeDirectly(id: string, def) {
        return eval(GM_getValue(id, (def || '({})')));
    }

    serializeDirectly(id: string, val) {
        GM_setValue(id, uneval(val));
    }

    deserialize(id: string, def) {
        return eval(this.getValue(id, (def || '({})')));
    }

    serialize(id: string, val) {
        this.setValue(id, uneval(val));
    }

    getValue(id: string, value) {
        return GM_getValue(id, value);
    }

    setValue(id: string, value: any) {
        GM_setValue(id, value);
    }
}
