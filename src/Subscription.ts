/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import {DAO} from "./DAO";
import * as NodeCreationObserver from "node-creation-observer";

export class Subscription {
    restrictedOnKeywords: string[];
    filteredOutKeywords: string[];
    filteringEnabled: boolean;
    restrictingEnabled: boolean;
    sortingEnabled: boolean;
    sortingType: string;
    keywords: any;
    dao: DAO;

    constructor(path: string) {
        this.dao = new DAO(path);
        this.restrictedOnKeywords = this.dao.deserialize(cst.restrictedOnKeywordsId, []);
        this.filteredOutKeywords = this.dao.deserialize(cst.filteredOutKeywordsId, []);
        this.filteringEnabled = this.dao.getValue(cst.filteringEnabledId, false);
        this.restrictingEnabled = this.dao.getValue(cst.restrictingEnabledId, false);
        this.sortingEnabled = this.dao.getValue(cst.sortingEnabledId, false);
        this.sortingType = this.dao.getValue(cst.sortingTypeId, 'nbRecommendationsDesc');
        this.keywords = {};
        this.keywords[cst.restrictedOnKeywordsId] = {
            list: this.restrictedOnKeywords,
            plusBtnId: "AddRestrictedOnKeyword",
            eraseBtnId: "DeleteAllRestrictedOnKeyword"
        };
        this.keywords[cst.filteredOutKeywordsId] = {
            list: this.filteredOutKeywords,
            plusBtnId: "AddFilteredOutKeyword",
            eraseBtnId: "DeleteAllFilteredOutKeyword"
        };
    }
    
    getDAO() {
        return this.dao;
    }
}
