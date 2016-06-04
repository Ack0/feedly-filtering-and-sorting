import {FilteringType, SortingType, getFilteringTypes} from "./DataTypes";

export class SubscriptionDTO {
    url: string;
    filteringEnabled: boolean = false;
    restrictingEnabled: boolean = false;
    sortingEnabled: boolean = true;
    sortingType: SortingType = SortingType.PopularityDesc;
    filteringListsByType: { [key: number]: string[]; } = {};
    
    constructor(url: string) {
        this.url = url;
        getFilteringTypes().forEach((type) => {
            this.filteringListsByType[type] = [];
        });
    }
}
