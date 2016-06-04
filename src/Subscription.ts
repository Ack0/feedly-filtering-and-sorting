/// <reference path="./_references.d.ts" />

import {SubscriptionDTO} from "./SubscriptionDTO";
import {SubscriptionDAO} from "./SubscriptionDAO";
import {FilteringType, SortingType, getFilteringTypes} from "./DataTypes";

export class Subscription {
    dto: SubscriptionDTO;
    dao: SubscriptionDAO;

    constructor(dto: SubscriptionDTO, dao: SubscriptionDAO) {
        this.dto = dto;
        this.dao = dao;
    }

    update(subscription: Subscription, skipSave?: boolean) {
        var newDTO = subscription.clone(this.getURL());
        this.setDTO(newDTO);
        if(! skipSave) {
            this.dao.save(this.dto);
        }
    }
    
    clone(cloneUrl: string): SubscriptionDTO {
        return this.dao.clone(this.dto, cloneUrl);
    }

    private setDTO(dto : SubscriptionDTO) {
        this.dto = dto;
    }

    getURL(): string {
        return this.dto.url;
    }
    
    isFilteringEnabled(): boolean {
        return this.dto.filteringEnabled;
    }
    
    setFilteringEnabled(filteringEnabled: boolean) {
        this.dto.filteringEnabled = filteringEnabled;
        this.dao.save(this.dto);
    }
    
    isRestrictingEnabled(): boolean {
        return this.dto.restrictingEnabled;
    }
    
    setRestrictingEnabled(restrictingEnabled: boolean) {
        this.dto.restrictingEnabled = restrictingEnabled;
        this.dao.save(this.dto);
    }
    
    isSortingEnabled(): boolean {
        return this.dto.sortingEnabled;
    }
    
    setSortingEnabled(sortingEnabled: boolean) {
        this.dto.sortingEnabled = sortingEnabled;
        this.dao.save(this.dto);
    }
    
    getSortingType(): SortingType {
        return this.dto.sortingType;
    }
    
    setSortingType(sortingType: SortingType) {
        this.dto.sortingType = sortingType;
        this.dao.save(this.dto);
    }

    getFilteringList(type: FilteringType): string[] {
        return this.dto.filteringListsByType[type];
    }
    
    addKeyword(keyword: string, type: FilteringType) {        
        this.getFilteringList(type).push(keyword);
        this.dao.save(this.dto);
    }
    
    removeKeyword(keyword: string, type: FilteringType) {        
        var keywordList = this.getFilteringList(type);
        var index = keywordList.indexOf(keyword);
        if (index > -1) {
            keywordList.splice(index, 1);
        }
        this.dao.save(this.dto);
    }
    
    reset(type: FilteringType) {
        this.getFilteringList(type).length = 0;
        this.dao.save(this.dto);
    }
}
