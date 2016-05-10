/// <reference path="./_references.d.ts" />

import {SubscriptionDAO} from "./SubscriptionDAO";
import {FilteringType, SortingType} from "./DataTypes";

export class Subscription {
    filteringEnabled: boolean;
    restrictingEnabled: boolean;
    sortingEnabled: boolean;
    sortingType: SortingType;
    filteringListsByType: { [key: number]: string[]; } = {};
    
    dao: SubscriptionDAO;

    constructor(subscriptionDAO: SubscriptionDAO) {
        this.dao = subscriptionDAO;
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
