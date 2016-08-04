/// <reference path="./_references.d.ts" />

import {UIManager} from "./UIManager"
import {HTMLElementType} from "./DataTypes"
import {$id} from "./Utils";

export interface HTMLSubscriptionSettingConfig {
    update: (subscriptionSetting: HTMLSubscriptionSetting) => void;
    setUpChangeCallback?: (subscriptionSetting: HTMLSubscriptionSetting) => void;
    getHTMLValue?: (subscriptionSetting: HTMLSubscriptionSetting) => Object;
}

export class HTMLSubscriptionManager {
    subscriptionSettings: HTMLSubscriptionSetting[] = [];
    manager: UIManager;
    configByElementType: { [key: number]: HTMLSubscriptionSettingConfig; } = {};

    getChangeCallback(setting: HTMLSubscriptionSetting): Function {
        return function () {
            setting.manager.subscription["set" + setting.id](setting.config.getHTMLValue(setting));
            if (setting.refreshFilteringAndSorting) {
                setting.manager.refreshFilteringAndSorting();
            }
        }
    }

    constructor(manager: UIManager) {
        this.manager = manager;
        this.configByElementType[HTMLElementType.SelectBox] = {
            setUpChangeCallback: (subscriptionSetting) => {
                $id(subscriptionSetting.htmlId).change(this.getChangeCallback(subscriptionSetting));
            },
            getHTMLValue: (subscriptionSetting) => {
                return $id(subscriptionSetting.htmlId).val();
            },
            update: (subscriptionSetting) => {
                var value = this.manager.subscription["get" + subscriptionSetting.id]();
                $id(subscriptionSetting.htmlId).val(value);
            }
        };
        this.configByElementType[HTMLElementType.CheckBox] = {
            setUpChangeCallback: (subscriptionSetting) => {
                $id(subscriptionSetting.htmlId).change(this.getChangeCallback(subscriptionSetting));
            },
            getHTMLValue: (subscriptionSetting) => {
                return this.manager.isChecked($id(subscriptionSetting.htmlId));
            },
            update: (subscriptionSetting) => {
                var value = this.manager.subscription["is" + subscriptionSetting.id]();
                this.manager.setChecked(subscriptionSetting.htmlId, value);
            }
        };
        this.configByElementType[HTMLElementType.NumberInput] = {
            setUpChangeCallback: (subscriptionSetting) => {
                var callback = this.getChangeCallback(subscriptionSetting)
                $id(subscriptionSetting.htmlId)[0].oninput = (ev) => {
                    callback();
                };
            },
            getHTMLValue: (subscriptionSetting) => {
                return Number($id(subscriptionSetting.htmlId).val());
            },
            update: this.configByElementType[HTMLElementType.SelectBox].update
        };
    }

    registerSettings(ids: string[], type: HTMLElementType, refreshFilteringAndSorting?: boolean, subscriptionSettingConfig?: HTMLSubscriptionSettingConfig) {
        this.addSettings(ids, this.configByElementType[type], refreshFilteringAndSorting, subscriptionSettingConfig);
    }

    addSettings(ids: string[], config: HTMLSubscriptionSettingConfig, refreshFilteringAndSorting?: boolean, subscriptionSettingConfig?: HTMLSubscriptionSettingConfig) {
        ids.forEach(id => {
            var setting = new HTMLSubscriptionSetting(this.manager, id, config, refreshFilteringAndSorting, subscriptionSettingConfig);
            this.subscriptionSettings.push(setting);
        });
    }

    setUpCallbacks() {
        this.subscriptionSettings.forEach(subscriptionSetting => {
            subscriptionSetting.setUpCallbacks();
        });
    }

    update() {
        this.subscriptionSettings.forEach(subscriptionSetting => {
            subscriptionSetting.update();
        });
    }
}

export class HTMLSubscriptionSetting {
    id: string;
    htmlId: string;
    config: HTMLSubscriptionSettingConfig;
    refreshFilteringAndSorting: boolean;
    manager: UIManager;

    constructor(manager: UIManager, id: string, config: HTMLSubscriptionSettingConfig, refreshFilteringAndSorting?: boolean, subscriptionSettingConfig?: HTMLSubscriptionSettingConfig) {
        this.manager = manager;
        this.id = id;
        this.htmlId = manager.getHTMLId(id);
        this.refreshFilteringAndSorting = refreshFilteringAndSorting == null ? true : refreshFilteringAndSorting;
        var getHTMLValue, update;
        if (subscriptionSettingConfig != null) {
            getHTMLValue = subscriptionSettingConfig.getHTMLValue;
            update = subscriptionSettingConfig.update;
        }
        getHTMLValue = getHTMLValue == null ? config.getHTMLValue : getHTMLValue;
        update = update == null ? config.update : update;

        this.config = {
            setUpChangeCallback: config.setUpChangeCallback,
            getHTMLValue: getHTMLValue,
            update: update
        }
    }

    update() {
        this.config.update(this);
    }

    setUpCallbacks() {
        this.config.setUpChangeCallback(this);
    }

}
