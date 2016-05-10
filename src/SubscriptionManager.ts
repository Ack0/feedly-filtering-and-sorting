/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDAO} from "./SubscriptionDAO";

export class SubscriptionManager {
    private currentSubscription : Subscription;
    private dao = new SubscriptionDAO();
    
    constructor() {
    }
    
    updateSubscription(url: string) : Subscription {
        console.log("url changed: " + url);
        this.currentSubscription = this.dao.get("");
        return this.currentSubscription; 
    }
}