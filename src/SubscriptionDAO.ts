
import {FilteringType, SortingType, getFilteringTypes, getFilteringTypeId} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDTO} from "./SubscriptionDTO";
import {SubscriptionManager} from "./SubscriptionManager";
import {LocalPersistence} from "./LocalPersistence";

export class SubscriptionDAO {
    private SUBSCRIPTION_ID_PREFIX = "subscription_";
    private defaultSubscription: SubscriptionDTO;
    
    save(dto: SubscriptionDTO) { 
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        LocalPersistence.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    }

    load(url: string): Subscription {
        var subscriptionDTO : SubscriptionDTO = LocalPersistence.get(this.getSubscriptionId(url), null);
        if(subscriptionDTO != null) {
            console.log("Loaded saved subscription: " + JSON.stringify(subscriptionDTO));
        } else {
            if(this.defaultSubscription == null) {
                subscriptionDTO = new SubscriptionDTO(url);
                this.save(subscriptionDTO);
            } else {
                subscriptionDTO = this.clone(this.defaultSubscription, url);
            }
        }
        var subscription = new Subscription(subscriptionDTO, this);
        return subscription;
    }
    
    clone(dtoToClone : SubscriptionDTO, cloneUrl: string): SubscriptionDTO {
        var clone = new SubscriptionDTO(cloneUrl);
        clone.filteringEnabled = dtoToClone.filteringEnabled;
        clone.restrictingEnabled = dtoToClone.restrictingEnabled;
        clone.sortingEnabled = dtoToClone.sortingEnabled;
        clone.sortingType = dtoToClone.sortingType;
        getFilteringTypes().forEach((type) => {
            clone.filteringListsByType[type] = dtoToClone.filteringListsByType[type].slice(0);
        });
        return clone;
    }

    setDefaultSubscription(defaultSubscription: Subscription) {
        this.defaultSubscription = defaultSubscription.dto;
    }

    getAllSubscriptionURLs() : string[] {
        var urls = GM_listValues().filter((value: string) => {
            return value.indexOf(this.SUBSCRIPTION_ID_PREFIX) == 0;
        });
        urls = urls.map<string>((value: string) => {
            return value.substring(this.SUBSCRIPTION_ID_PREFIX.length);
        });
        return urls;
    }
    
    getSubscriptionId(url: string): string {
        return this.SUBSCRIPTION_ID_PREFIX + url;
    }
}