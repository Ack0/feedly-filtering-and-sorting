/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDAO} from "./SubscriptionDAO";

export class SubscriptionManager {
    private currentSubscription: Subscription;
    private dao: SubscriptionDAO;
    private urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");

    constructor() {
        this.dao = new SubscriptionDAO();
    }

    loadSubscription(globalSettingsEnabled: boolean): Subscription {
        var subscription: Subscription;
        if (globalSettingsEnabled) {
            subscription = this.dao.loadGlobalSettings();
        } else {
            subscription = new Subscription(this.getActualSubscriptionURL(), this.dao);
        }
        return this.currentSubscription = subscription;
    }

    linkToSubscription(url: string) {
        if (url === this.getActualSubscriptionURL()) {
            alert("Linking to the same subscription URL is impossible");
        } else {
            this.dao.linkSubscriptions(this.getActualSubscriptionURL(), url);
        }
    }

    deleteSubscription(url: string) {
        this.dao.delete(url);
    }

    importKeywords(url: string) {
        this.currentSubscription.update(url);
    }

    getAllSubscriptionURLs(): string[] {
        return this.dao.getAllSubscriptionURLs();
    }

    getActualSubscriptionURL(): string {
        return document.URL.replace(this.urlPrefixPattern, "");
    }

    isGlobalMode() : boolean {
        return this.dao.isURLGlobal(this.currentSubscription.getURL());
    }

    getCurrentSubscription() {
        return this.currentSubscription;
    }
}