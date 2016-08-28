
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
        var subscriptionDTO: SubscriptionDTO = LocalPersistence.get(this.getSubscriptionId(url), null);
        if (subscriptionDTO != null) {
            console.log("Loaded saved subscription: " + JSON.stringify(subscriptionDTO));
        } else {
            if (this.defaultSubscription == null) {
                subscriptionDTO = new SubscriptionDTO(url);
                this.save(subscriptionDTO);
            } else {
                subscriptionDTO = this.clone(this.defaultSubscription, url);
            }
        }
        var subscription = new Subscription(subscriptionDTO, this);
        return subscription;
    }

    clone(dtoToClone: SubscriptionDTO, cloneUrl: string): SubscriptionDTO {
        var clone = new SubscriptionDTO(cloneUrl);
        if (dtoToClone == null) {
            return clone;
        }
        var defDto = this.defaultSubscription != null ? this.defaultSubscription : clone;
        clone.filteringEnabled = (dtoToClone.filteringEnabled != null) ? dtoToClone.filteringEnabled : defDto.filteringEnabled;
        clone.restrictingEnabled = (dtoToClone.restrictingEnabled != null) ? dtoToClone.restrictingEnabled : defDto.restrictingEnabled;
        clone.sortingEnabled = (dtoToClone.sortingEnabled != null) ? dtoToClone.sortingEnabled : defDto.sortingEnabled;
        clone.sortingType = (dtoToClone.sortingType != null) ? dtoToClone.sortingType : defDto.sortingType;
        clone.pinHotToTop = (dtoToClone.pinHotToTop != null) ? dtoToClone.pinHotToTop : defDto.pinHotToTop;
        clone.advancedControlsReceivedPeriod = this.cloneAdvancedControlsReceivedPeriod(dtoToClone);
        getFilteringTypes().forEach((type) => {
            clone.filteringListsByType[type] = dtoToClone.filteringListsByType[type].slice(0);
        });
        return clone;
    }

    cloneAdvancedControlsReceivedPeriod(dtoToClone: SubscriptionDTO): AdvancedControlsReceivedPeriod {
        var advCtrols = new AdvancedControlsReceivedPeriod();
        var advCtrolsToClone = dtoToClone.advancedControlsReceivedPeriod;
        if (advCtrolsToClone == null) {
            return advCtrols;
        }
        var defAdvCtrols = this.defaultSubscription != null ? this.defaultSubscription.advancedControlsReceivedPeriod : advCtrols;
        advCtrols.maxHours = (advCtrolsToClone.maxHours != null) ? advCtrolsToClone.maxHours : defAdvCtrols.maxHours;
        advCtrols.keepUnread = (advCtrolsToClone.keepUnread != null) ? advCtrolsToClone.keepUnread : defAdvCtrols.keepUnread;
        advCtrols.hide = (advCtrolsToClone.hide != null) ? advCtrolsToClone.hide : defAdvCtrols.hide;
        advCtrols.showIfHot = (advCtrolsToClone.showIfHot != null) ? advCtrolsToClone.showIfHot : defAdvCtrols.showIfHot;
        advCtrols.minPopularity = (advCtrolsToClone.minPopularity != null) ? advCtrolsToClone.minPopularity : defAdvCtrols.minPopularity;
        advCtrols.markAsReadVisible = (advCtrolsToClone.markAsReadVisible != null) ? advCtrolsToClone.markAsReadVisible : defAdvCtrols.markAsReadVisible;
        return advCtrols;
    }

    loadGlobalSettings(): Subscription {
        var globalSettings = this.load(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL);
        this.defaultSubscription = globalSettings.dto;
        return globalSettings;
    }

    getAllSubscriptionURLs(): string[] {
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