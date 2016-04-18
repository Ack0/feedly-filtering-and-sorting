/// <reference path="./_references.d.ts" />

export class DAO {
    path: string;

    constructor(path: string) {
        this.path = path;
    }

    getValue(id: string, defaultValue) {
        return JSON.parse(GM_getValue(id, JSON.stringify(defaultValue)));
    }

    setValue(id: string, value: any) {
        GM_setValue(id, JSON.stringify(value));
    }
}
