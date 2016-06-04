/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDAO} from "./SubscriptionDAO";

export class SubscriptionManager {
    private GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
    private currentSubscription : Subscription;
    private dao = new SubscriptionDAO();
    private urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
    private currentUnreadCount = 0;
    
    updateSubscription(globalSettingsEnabled: boolean) : Subscription {
        this.updateUnreadCount();
        var url = this.getSubscriptionURL(globalSettingsEnabled);
        return this.currentSubscription = this.dao.load(url); 
    }
    
    importKeywords(url: string) {
        var importedSubscription = this.dao.load(url);
        this.currentSubscription.update(importedSubscription);
    }
    
    getAllSubscriptionURLs() : string[] {
        return this.dao.getAllSubscriptionURLs();
    }
    
    getSubscriptionURL(globalSettingsEnabled: boolean): string {
        if(globalSettingsEnabled) {
            return this.GLOBAL_SETTINGS_SUBSCRIPTION_URL;
        }
        var url = document.URL;
        url = url.replace(this.urlPrefixPattern, "");
        return url;
    }
    
    updateUnreadCount() {
        var unreadCountHint = $(ext.unreadCountSelector).text().trim();
        var unreadCountStr = unreadCountHint.split(" ")[0];
        var unreadCount = Number(unreadCountStr);
        this.currentUnreadCount = isNaN(unreadCount) ? 0 : unreadCount;
    }
    
    getCurrentUnreadCount() {
        return this.currentUnreadCount;
    }
}