
import {FilteringType, SortingType, getFilteringTypes, getFilteringTypeId} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionDTO, AdvancedControlsReceivedPeriod} from "./SubscriptionDTO";
import {SubscriptionManager} from "./SubscriptionManager";
import {LocalPersistence} from "./LocalPersistence";
import {registerAccessors} from "./Utils";

export class SubscriptionDAO {
    private SUBSCRIPTION_ID_PREFIX = "subscription_";
    private GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
    private defaultSubscriptionDTO: SubscriptionDTO;

    constructor() {
        registerAccessors(new SubscriptionDTO(""), "dto", Subscription.prototype, this.save, this);
    }

    save(dto: SubscriptionDTO) {
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        LocalPersistence.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    }

    load(url: string): SubscriptionDTO {
        var subscriptionDTO: SubscriptionDTO;
        var id = this.getSubscriptionId(url);
        var dto = LocalPersistence.get(id, null);
        if (dto != null) {
            var linkedURL = (<LinkedSubscriptionDTO> dto).linkedUrl;
            if (linkedURL != null) {
                console.log("Loading linked subscription: " + linkedURL);
                subscriptionDTO = this.load(linkedURL);
            } else {
                subscriptionDTO = <SubscriptionDTO> dto;
                console.log("Loaded saved subscription: " + JSON.stringify(subscriptionDTO));
            }
        }
        if (subscriptionDTO == null) {
            if (this.defaultSubscriptionDTO == null) {
                subscriptionDTO = new SubscriptionDTO(url);
                this.save(subscriptionDTO);
            } else {
                subscriptionDTO = this.clone(this.defaultSubscriptionDTO, url);
            }
        }
        return subscriptionDTO;
    }
    
    delete(url: string) {
        LocalPersistence.delete(this.getSubscriptionId(url));
        console.log("Deleted: " + url);
    }

    clone(dtoToClone: SubscriptionDTO, cloneUrl: string): SubscriptionDTO {
        var clone = new SubscriptionDTO(cloneUrl);
        if (dtoToClone == null) {
            return clone;
        }
        var defDto = this.defaultSubscriptionDTO != null ? this.defaultSubscriptionDTO : clone;
        clone.filteringEnabled = (dtoToClone.filteringEnabled != null) ? dtoToClone.filteringEnabled : defDto.filteringEnabled;
        clone.restrictingEnabled = (dtoToClone.restrictingEnabled != null) ? dtoToClone.restrictingEnabled : defDto.restrictingEnabled;
        clone.sortingEnabled = (dtoToClone.sortingEnabled != null) ? dtoToClone.sortingEnabled : defDto.sortingEnabled;
        clone.sortingType = (dtoToClone.sortingType != null) ? dtoToClone.sortingType : defDto.sortingType;
        clone.pinHotToTop = (dtoToClone.pinHotToTop != null) ? dtoToClone.pinHotToTop : defDto.pinHotToTop;
        clone.advancedControlsReceivedPeriod = this.cloneAdvancedControlsReceivedPeriod(dtoToClone);
        var filteringListsByTypeToClone = (dtoToClone.filteringListsByType != null) ? dtoToClone.filteringListsByType : defDto.filteringListsByType;
        getFilteringTypes().forEach((type) => {
            clone.filteringListsByType[type] = filteringListsByTypeToClone[type].slice(0);
        });
        return clone;
    }

    cloneAdvancedControlsReceivedPeriod(dtoToClone: SubscriptionDTO): AdvancedControlsReceivedPeriod {
        var advCtrols = new AdvancedControlsReceivedPeriod();
        var advCtrolsToClone = dtoToClone.advancedControlsReceivedPeriod;
        if (advCtrolsToClone == null) {
            return advCtrols;
        }
        var defAdvCtrols = this.defaultSubscriptionDTO != null ? this.defaultSubscriptionDTO.advancedControlsReceivedPeriod : advCtrols;
        advCtrols.maxHours = (advCtrolsToClone.maxHours != null) ? advCtrolsToClone.maxHours : defAdvCtrols.maxHours;
        advCtrols.keepUnread = (advCtrolsToClone.keepUnread != null) ? advCtrolsToClone.keepUnread : defAdvCtrols.keepUnread;
        advCtrols.hide = (advCtrolsToClone.hide != null) ? advCtrolsToClone.hide : defAdvCtrols.hide;
        advCtrols.showIfHot = (advCtrolsToClone.showIfHot != null) ? advCtrolsToClone.showIfHot : defAdvCtrols.showIfHot;
        advCtrols.minPopularity = (advCtrolsToClone.minPopularity != null) ? advCtrolsToClone.minPopularity : defAdvCtrols.minPopularity;
        advCtrols.markAsReadVisible = (advCtrolsToClone.markAsReadVisible != null) ? advCtrolsToClone.markAsReadVisible : defAdvCtrols.markAsReadVisible;
        return advCtrols;
    }

    loadGlobalSettings(): Subscription {
        var globalSettings = new Subscription(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL, this);
        this.defaultSubscriptionDTO = globalSettings.dto;
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
    
    linkSubscriptions(url: string, linkedURL: string) {
        var id = this.getSubscriptionId(url);
        var linkedSub = new LinkedSubscriptionDTO(linkedURL);
        LocalPersistence.put(id, linkedSub);
        console.log("Subscription linked: " + JSON.stringify(linkedSub));
    }

    isURLGlobal(url: string) : boolean {
        return url === this.GLOBAL_SETTINGS_SUBSCRIPTION_URL;
    }
}

class LinkedSubscriptionDTO {
    linkedUrl: string;
    constructor(linkedUrl: string) {
        this.linkedUrl = linkedUrl;
    }
}