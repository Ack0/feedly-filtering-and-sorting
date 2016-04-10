/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import {DAO} from "./DAO";
import * as NodeCreationObserver from "node-creation-observer";

export enum FilteringType {
    RestrictedOn,
    FilteredOut
}

export class FilteringTypeIds {
    typeId: string;
    plusBtnId: string;
    eraseBtnId: string;
}

export class Subscription {
    filteringEnabled: boolean;
    restrictingEnabled: boolean;
    sortingEnabled: boolean;
    sortingType: string;
    filteringIdsByType: { [key: number]: FilteringTypeIds; } = {};
    filteringListsByType: { [key: number]: string[]; } = {};
    dao: DAO;

    constructor(path: string) {
        this.dao = new DAO(path);
        this.filteringEnabled = this.dao.getValue(cst.filteringEnabledId, false);
        this.restrictingEnabled = this.dao.getValue(cst.restrictingEnabledId, false);
        this.sortingEnabled = this.dao.getValue(cst.sortingEnabledId, false);
        this.sortingType = this.dao.getValue(cst.sortingTypeId, 'nbRecommendationsDesc');

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

        this.forEachFilteringType(function(type) {
            var ids = this.filteringIdsByType[type];
            this.filteringListsByType[type] = this.dao.deserialize(ids.typeId, []);
        }, this);
    }

    getDAO() {
        return this.dao;
    }

    getFilteringList(type: FilteringType): string[] {
        return this.filteringListsByType[type];
    }

    getIds(type: FilteringType) {
        return this.filteringIdsByType[type];
    }

    forEachFilteringType(callback: (type: FilteringType) => any, thisArg?: any) {
        Object.keys(this.filteringIdsByType).forEach(function(type) {
            callback.call(thisArg, type);
        });
    }

    save(type: FilteringType) {
        this.dao.serialize(this.getIds(type).typeId, this.getFilteringList(type));
    }
}
