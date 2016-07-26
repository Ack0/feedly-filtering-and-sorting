/// <reference path="./_references.d.ts" />

import {UIManager} from "./UIManager"
import {HTMLElementType} from "./DataTypes"
import {$id} from "./Utils";

export interface HTMLSubscriptionSettingConfig {
    getHTMLValue: (subscriptionSetting: HTMLSubscriptionSetting) => any;
    update: (subscriptionSetting: HTMLSubscriptionSetting) => void;
}

interface HTMLSettingConfig extends HTMLSubscriptionSettingConfig {
    changeFunction: string;
}

export class HTMLSubscriptionManager {
    subscriptionSettings: HTMLSubscriptionSetting[] = [];
    manager: UIManager;
    configByElementType: { [key: number]: HTMLSettingConfig; } = {};

    constructor(manager: UIManager) {
        this.manager = manager;
        this.configByElementType[HTMLElementType.SelectBox] = {
            changeFunction: "change",
            getHTMLValue: (subscriptionSetting) => {
                return $id(subscriptionSetting.htmlId).val();
            },
            update: (subscriptionSetting) => {
                var value = this.manager.subscription["get" + subscriptionSetting.id]();
                $id(subscriptionSetting.htmlId).val(value);
            }
        };
        this.configByElementType[HTMLElementType.CheckBox] = {
            changeFunction: "change",
            getHTMLValue: (subscriptionSetting) => {
                return this.manager.isChecked($id(subscriptionSetting.htmlId));
            },
            update: (subscriptionSetting) => {
                var value = this.manager.subscription["is" + subscriptionSetting.id]();
                this.manager.setChecked(subscriptionSetting.htmlId, value);
            }
        };
    }

    registerSettings(ids: string[], type: HTMLElementType, refreshFilteringAndSorting?: boolean) {
        this.addSettings(ids, this.configByElementType[type], refreshFilteringAndSorting);
    }

    addSettings(ids: string[], config: HTMLSettingConfig, refreshFilteringAndSorting?: boolean) {
        ids.forEach(id => {
            var setting = new HTMLSubscriptionSetting(this.manager, id, config, refreshFilteringAndSorting);
            this.subscriptionSettings.push(setting);
        });
    }

    init() {
        this.subscriptionSettings.forEach(subscriptionSetting => {
            subscriptionSetting.init();
        });
    }

    update() {
        this.subscriptionSettings.forEach(subscriptionSetting => {
            subscriptionSetting.update();
        });
    }
}

class HTMLSubscriptionSetting {
    id: string;
    htmlId: string;
    config: HTMLSettingConfig;
    refreshFilteringAndSorting: boolean;
    manager: UIManager;
    
    constructor(manager: UIManager, id: string, config: HTMLSettingConfig, refreshFilteringAndSorting?: boolean, subscriptionSettingConfig?: HTMLSubscriptionSettingConfig) {
        this.manager = manager;
        this.id = id;
        this.htmlId = manager.getHTMLId(id);
        this.refreshFilteringAndSorting = refreshFilteringAndSorting == null ? true : refreshFilteringAndSorting;
        var getHTMLValue = config.getHTMLValue;
        var update = config.update;
        if (subscriptionSettingConfig != null) {
            getHTMLValue = subscriptionSettingConfig.getHTMLValue;
            update = subscriptionSettingConfig.update;
        }
        this.config = {
            changeFunction: config.changeFunction,
            getHTMLValue: getHTMLValue,
            update: update
        }
    }

    init() {
        var self = this;
        $id(this.htmlId)[this.config.changeFunction](function () {
            self.manager.subscription["set" + self.id](self.config.getHTMLValue(self));
            if (self.refreshFilteringAndSorting) {
                self.manager.refreshFilteringAndSorting();
            }
        });
    }

    update() {
        this.config.update(this);
    }
}
