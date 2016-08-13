/// <reference path="./_references.d.ts" />

import {LocalPersistence} from "./LocalPersistence";
import {UIManager} from "./UIManager"
import {$id, setRadioChecked, isRadioChecked} from "./Utils";

export class GlobalSettingsCheckBox {
    id: string;
    htmlId: string;
    uiManager: UIManager;
    enabled: boolean;
    fullRefreshOnChange = true;
    
    constructor(id: string, uiManager: UIManager, fullRefreshOnChange?: boolean) {
        this.id = id;
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        this.enabled = LocalPersistence.get(this.id, true);
        setRadioChecked(this.htmlId, this.enabled);
    }
    
    isEnabled(): boolean {
        return this.enabled;
    }

    setEnabled(enabled: boolean) {
        LocalPersistence.put(this.id, enabled);
        this.enabled = enabled;
        this.refreshUI();
    }
    
    initUI() {
        var this_ = this;
        $id(this.htmlId).click(function () {
            this_.setEnabled(isRadioChecked($(this)));
            this_.uiManager.refreshPage();
        });
        this.refreshUI();
    }
    
    refreshUI() {
        setRadioChecked(this.htmlId, this.enabled);
    }
    
}