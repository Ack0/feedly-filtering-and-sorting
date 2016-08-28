import {FilteringType, SortingType, getFilteringTypes} from "./DataTypes";

export class SubscriptionDTO {
    url: string;
    filteringEnabled = false;
    restrictingEnabled = false;
    sortingEnabled = true;
    sortingType: SortingType = SortingType.PopularityDesc;
    advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
    pinHotToTop = false;
    filteringListsByType: { [key: number]: string[]; } = {};
    
    constructor(url: string) {
        this.url = url;
        getFilteringTypes().forEach((type) => {
            this.filteringListsByType[type] = [];
        });
    }
}

export class AdvancedControlsReceivedPeriod {
    maxHours = 6;
    keepUnread = false;
    hide = false;
    showIfHot = false;
    minPopularity = 200;
    markAsReadVisible = false;
}
