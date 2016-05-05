/// <reference path="./_references.d.ts" />

import {DAO} from "./DAO";

export enum FilteringType {
    RestrictedOn,
    FilteredOut
}

export enum SortingType {
    PopularityDesc,
    PopularityAsc,
    TitleDesc,
    TitleAsc
}

export class FilteringTypeIds {
    typeId: string;
    plusBtnId: string;
    eraseBtnId: string;
}

export class Subscription {
    private filteringEnabled: boolean;
    private restrictingEnabled: boolean;
    private sortingEnabled: boolean;
    private sortingType: SortingType;
    private filteringIdsByType: { [key: number]: FilteringTypeIds; } = {};
    private filteringListsByType: { [key: number]: string[]; } = {};
    dao: DAO;
	filteringEnabledId = "filteringEnabled";
	restrictingEnabledId = "restrictingEnabled";
	sortingEnabledId = "sortingEnabled";
	sortingTypeId = "sortingType";

    constructor(path: string) {
        this.dao = new DAO(path);
        this.filteringEnabled = this.dao.getValue(this.filteringEnabledId, false);
        this.restrictingEnabled = this.dao.getValue(this.restrictingEnabledId, false);
        this.sortingEnabled = this.dao.getValue(this.sortingEnabledId, false);
        this.sortingType = this.dao.getValue(this.sortingTypeId, SortingType.PopularityDesc);

        this.filteringIdsByType[FilteringType.RestrictedOn] = {
            typeId: "restrictedOnKeywords",
            plusBtnId: "AddRestrictedOnKeyword",
            eraseBtnId: "DeleteAllRestrictedOnKeyword"
        };
        this.filteringIdsByType[FilteringType.FilteredOut] = {
            typeId: "filteredOutKeywords",
            plusBtnId: "AddFilteredOutKeyword",
            eraseBtnId: "DeleteAllFilteredOutKeyword"
        };

        this.forEachFilteringType((type) => {
            var ids = this.filteringIdsByType[type];
            this.filteringListsByType[type] = this.dao.getValue(ids.typeId, []);
        }, this);
    }

    isFilteringEnabled(): boolean {
        return this.filteringEnabled;
    }
    setFilteringEnabled(filteringEnabled: boolean) {
        this.filteringEnabled = filteringEnabled;
        this.dao.setValue(this.filteringEnabledId, this.filteringEnabled);
    }
    isRestrictingEnabled(): boolean {
        return this.restrictingEnabled;
    }
    setRestrictingEnabled(restrictingEnabled: boolean) {
        this.restrictingEnabled = restrictingEnabled;
        this.dao.setValue(this.restrictingEnabledId, this.restrictingEnabled);
    }
    isSortingEnabled(): boolean {
        return this.sortingEnabled;
    }
    setSortingEnabled(sortingEnabled: boolean) {
        this.sortingEnabled = sortingEnabled;
        this.dao.setValue(this.sortingEnabledId, this.sortingEnabled);
    }
    getSortingType(): SortingType {
        return this.sortingType;
    }
    setSortingType(sortingType: SortingType) {
        this.sortingType = sortingType;
        this.dao.setValue(this.sortingTypeId, this.sortingType);
    }

    getFilteringList(type: FilteringType): string[] {
        return this.filteringListsByType[type];
    }

    getIds(type: FilteringType) {
        return this.filteringIdsByType[type];
    }

    forEachFilteringType(callback: (type: FilteringType) => any, thisArg?: any) {
        Object.keys(this.filteringIdsByType).forEach(function (type) {
            callback.call(thisArg, type);
        });
    }

    save(type: FilteringType) {
        this.dao.setValue(this.getIds(type).typeId, this.getFilteringList(type));
    }
}
