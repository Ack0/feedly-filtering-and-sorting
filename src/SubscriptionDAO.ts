
import {FilteringType, SortingType, getFilteringTypes, getFilteringTypeId} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionManager} from "./SubscriptionManager";

export class SubscriptionDAO {
	filteringEnabledId = "filteringEnabled";
	restrictingEnabledId = "restrictingEnabled";
	sortingEnabledId = "sortingEnabled";
	sortingTypeId = "sortingType";
    
    save(subscription: Subscription) {
        this.setValue(this.filteringEnabledId, subscription.filteringEnabled);
        this.setValue(this.restrictingEnabledId, subscription.restrictingEnabled);
        this.setValue(this.sortingEnabledId, subscription.sortingEnabled);
        this.setValue(this.sortingTypeId, subscription.sortingType);
        getFilteringTypes().forEach((type) => {
            this.setValue(getFilteringTypeId(type), subscription.getFilteringList(type));
        }, this);
    }
    
    get(path: string): Subscription {
        var subscription = new Subscription(this);
        subscription.filteringEnabled = this.getValue(this.filteringEnabledId, false);
        subscription.restrictingEnabled = this.getValue(this.restrictingEnabledId, false);
        subscription.sortingEnabled = this.getValue(this.sortingEnabledId, false);
        subscription.sortingType = this.getValue(this.sortingTypeId, SortingType.PopularityDesc);
        getFilteringTypes().forEach((type) => {
            subscription.filteringListsByType[type] = this.getValue(getFilteringTypeId(type), []);
        }, this);
        return subscription;
    }
    
    getValue(id: string, defaultValue) {
        return JSON.parse(GM_getValue(id, JSON.stringify(defaultValue)));
    }

    setValue(id: string, value: any) {
        GM_setValue(id, JSON.stringify(value));
    }
}