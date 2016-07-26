import {FilteringType, SortingType, getFilteringTypes} from "./DataTypes";

export class SubscriptionDTO {
    url: string;
    filteringEnabled: boolean = false;
    restrictingEnabled: boolean = false;
    sortingEnabled: boolean = true;
    sortingType: SortingType = SortingType.PopularityDesc;
    advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
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
}
