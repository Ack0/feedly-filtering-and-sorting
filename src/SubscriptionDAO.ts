
import {FilteringType, SortingType, getFilteringTypes, getFilteringTypeId} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDTO, AdvancedControlsReceivedPeriod} from "./SubscriptionDTO";
import {SubscriptionManager} from "./SubscriptionManager";
import {LocalPersistence} from "./LocalPersistence";
import {registerAccessors} from "./Utils";

export class SubscriptionDAO {
    private SUBSCRIPTION_ID_PREFIX = "subscription_";
    private GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
    private defaultSubscription: SubscriptionDTO;

    constructor() {
        registerAccessors(new SubscriptionDTO(""), "dto", Subscription.prototype, this.save, this);
    }
    
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
        clone.advancedControlsReceivedPeriod = dtoToClone.advancedControlsReceivedPeriod;
        getFilteringTypes().forEach((type) => {
            clone.filteringListsByType[type] = dtoToClone.filteringListsByType[type].slice(0);
        });
        return clone;
    }

    loadGlobalSettings() : Subscription {
        var globalSettings = this.load(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL);
        this.defaultSubscription = globalSettings.dto;
        return globalSettings;
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