/// <reference path="./_references.d.ts" />

export class LocalPersistence {
    public static get<t>(id: string, defaultValue:t): t {
        return JSON.parse(GM_getValue(id, JSON.stringify(defaultValue)));
    }

    public static put(id: string, value: any, replace? : (key: string, value: any) => any) {
        GM_setValue(id, JSON.stringify(value, replace));
    }

    public static delete(id: string) {
        GM_deleteValue(id);
    }
}