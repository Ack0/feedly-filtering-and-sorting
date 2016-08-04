/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDAO} from "./SubscriptionDAO";

export class SubscriptionManager {
    private currentSubscription : Subscription;
    private globalSettings : Subscription;
    private dao : SubscriptionDAO;
    private urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
    private currentUnreadCount = 0;
    
    constructor() {
        this.dao = new SubscriptionDAO();
        this.globalSettings = this.dao.loadGlobalSettings();
    }
    
    loadSubscription(globalSettingsEnabled: boolean) : Subscription {
        this.currentUnreadCount = 0;
        var subscription: Subscription;
        if(globalSettingsEnabled) {
            subscription = this.globalSettings;
        } else {
            var url = this.getSubscriptionURL();
            subscription = this.dao.load(url);
        }
        return this.currentSubscription = subscription; 
    }
    
    importKeywords(url: string) {
        var importedSubscription = this.dao.load(url);
        this.currentSubscription.update(importedSubscription);
    }
    
    getAllSubscriptionURLs() : string[] {
        return this.dao.getAllSubscriptionURLs();
    }
    
    getSubscriptionURL(): string {
        var url = document.URL;
        url = url.replace(this.urlPrefixPattern, "");
        return url;
    }
    
    updateUnreadCount() {
        this.currentUnreadCount = $(ext.articleSelector).length;
    }
    
    getCurrentSubscription() {
        return this.currentSubscription;
    }
    
    getCurrentUnreadCount() {
        return this.currentUnreadCount;
    }
}