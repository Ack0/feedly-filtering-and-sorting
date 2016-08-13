/// <reference path="./_references.d.ts" />

import {UIManager} from "./UIManager"
import {HTMLElementType} from "./DataTypes"
import {$id, setRadioChecked, isRadioChecked} from "./Utils";

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
            setting.manager.refreshFilteringAndSorting();
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
                return isRadioChecked($id(subscriptionSetting.htmlId));
            },
            update: (subscriptionSetting) => {
                var value = this.manager.subscription["is" + subscriptionSetting.id]();
                setRadioChecked(subscriptionSetting.htmlId, value);
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

    registerSettings(ids: string[], type: HTMLElementType, subscriptionSettingConfig?: HTMLSubscriptionSettingConfig) {
        this.addSettings(ids, this.configByElementType[type], subscriptionSettingConfig);
    }

    addSettings(ids: string[], config: HTMLSubscriptionSettingConfig, subscriptionSettingConfig?: HTMLSubscriptionSettingConfig) {
        ids.forEach(id => {
            var setting = new HTMLSubscriptionSetting(this.manager, id, config, subscriptionSettingConfig);
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
    manager: UIManager;

    constructor(manager: UIManager, id: string, config: HTMLSubscriptionSettingConfig, subscriptionSettingConfig?: HTMLSubscriptionSettingConfig) {
        this.manager = manager;
        this.id = id;
        this.htmlId = manager.getHTMLId(id);
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
