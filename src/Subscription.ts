/// <reference path="./_references.d.ts" />

import {SubscriptionDTO, AdvancedControlsReceivedPeriod} from "./SubscriptionDTO";
import {SubscriptionDAO} from "./SubscriptionDAO";
import {FilteringType, SortingType, getFilteringTypes} from "./DataTypes";

export class Subscription {
    dto: SubscriptionDTO;
    private dao: SubscriptionDAO;

    constructor(dto: SubscriptionDTO, dao: SubscriptionDAO) {
        this.dto = dao.clone(dto, dto.url);
        this.dao = dao;
    }

    update(subscription: Subscription, skipSave?: boolean) {
        var newDTO = subscription.clone(this.getURL());
        this.dto = newDTO;
        if (!skipSave) {
            this.dao.save(this.dto);
        }
    }

    clone(cloneUrl: string): SubscriptionDTO {
        return this.dao.clone(this.dto, cloneUrl);
    }

    getURL(): string {
        return this.dto.url;
    }

    isFilteringEnabled(): boolean {
        return this.dto.filteringEnabled;
    }

    isRestrictingEnabled(): boolean {
        return this.dto.restrictingEnabled;
    }

    isSortingEnabled(): boolean {
        return this.dto.sortingEnabled;
    }

    isPinHotToTop(): boolean {
        return this.dto.pinHotToTop;
    }

    getAdvancedControlsReceivedPeriod(): AdvancedControlsReceivedPeriod {
        return this.dto.advancedControlsReceivedPeriod;
    }

    getSortingType(): SortingType {
        return this.dto.sortingType;
    }

    getFilteringList(type: FilteringType): string[] {
        return this.dto.filteringListsByType[type];
    }

    setHours_AdvancedControlsReceivedPeriod(hours: number) {
        if (hours > 23) {
            return;
        }
        var advancedPeriodDays = Math.floor(this.getAdvancedControlsReceivedPeriod().maxHours / 24);
        this.setMaxHours_AdvancedControlsReceivedPeriod(hours, advancedPeriodDays);
    }

    setDays_AdvancedControlsReceivedPeriod(days: number) {
        var advancedPeriodHours = this.getAdvancedControlsReceivedPeriod().maxHours % 24;
        this.setMaxHours_AdvancedControlsReceivedPeriod(advancedPeriodHours, days);
    }

    setMaxHours_AdvancedControlsReceivedPeriod(hours: number, days: number) {
        var maxHours = hours + 24 * days;
        this.getAdvancedControlsReceivedPeriod().maxHours = maxHours;
        this.dao.save(this.dto);
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

    resetFilteringList(type: FilteringType) {
        this.getFilteringList(type).length = 0;
        this.dao.save(this.dto);
    }
}
