/// <reference path="./_references.d.ts" />

import {SubscriptionDAO} from "./SubscriptionDAO";
import {FilteringType, SortingType, getFilteringTypes} from "./DataTypes";

export class Subscription {
    private url: string;
    private filteringEnabled: boolean = false;
    private restrictingEnabled: boolean = false;
    private sortingEnabled: boolean = true;
    private sortingType: SortingType = SortingType.PopularityDesc;
    private filteringListsByType: { [key: number]: string[]; } = {};
    
    dao: SubscriptionDAO;

    constructor(subscriptionDAO: SubscriptionDAO, url: string) {
        this.dao = subscriptionDAO;
        this.url = url;
        getFilteringTypes().forEach((type) => {
            this.filteringListsByType[type] = [];
        });
    }

    update(subscription: Subscription, skipSave?: boolean) {
        this.filteringEnabled = subscription.filteringEnabled;
        this.restrictingEnabled = subscription.restrictingEnabled;
        this.sortingEnabled = subscription.sortingEnabled;
        this.sortingType = subscription.sortingType;
        this.filteringListsByType = subscription.filteringListsByType;
        if(! skipSave) {
            this.dao.save(this);
        }
    }

    getURL(): string {
        return this.url;
    }
    
    isFilteringEnabled(): boolean {
        return this.filteringEnabled;
    }
    
    setFilteringEnabled(filteringEnabled: boolean) {
        this.filteringEnabled = filteringEnabled;
        this.dao.save(this);
    }
    
    isRestrictingEnabled(): boolean {
        return this.restrictingEnabled;
    }
    
    setRestrictingEnabled(restrictingEnabled: boolean) {
        this.restrictingEnabled = restrictingEnabled;
        this.dao.save(this);
    }
    
    isSortingEnabled(): boolean {
        return this.sortingEnabled;
    }
    
    setSortingEnabled(sortingEnabled: boolean) {
        this.sortingEnabled = sortingEnabled;
        this.dao.save(this);
    }
    
    getSortingType(): SortingType {
        return this.sortingType;
    }
    
    setSortingType(sortingType: SortingType) {
        this.sortingType = sortingType;
        this.dao.save(this);
    }

    getFilteringList(type: FilteringType): string[] {
        return this.filteringListsByType[type];
    }
    
    addKeyword(keyword: string, type: FilteringType) {        
        this.getFilteringList(type).push(keyword);
        this.dao.save(this);
    }
    
    removeKeyword(keyword: string, type: FilteringType) {        
        var keywordList = this.getFilteringList(type);
        var index = keywordList.indexOf(keyword);
        if (index > -1) {
            keywordList.splice(index, 1);
        }
        this.dao.save(this);
    }
    
    reset(type: FilteringType) {
        this.getFilteringList(type).length = 0;
        this.dao.save(this);
    }
}
