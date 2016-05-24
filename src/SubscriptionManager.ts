/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDAO} from "./SubscriptionDAO";

export class SubscriptionManager {
    private currentSubscription : Subscription;
    private dao = new SubscriptionDAO();
    private urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
    private currentUnreadCount = 0;
    
    updateSubscription() : Subscription {
        this.updateUnreadCount();
        var url = this.getSubscriptionURL();
        return this.currentSubscription = this.dao.load(url); 
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
        var unreadCountHint = $(ext.unreadCountSelector).text().trim();
        var unreadCountStr = unreadCountHint.split(" ")[0];
        var unreadCount = Number(unreadCountStr);
        this.currentUnreadCount = isNaN(unreadCount) ? 0 : unreadCount;
    }
    
    getCurrentUnreadCount() {
        return this.currentUnreadCount;
    }
}