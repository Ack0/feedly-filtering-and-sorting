/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType, getFilteringTypes, getFilteringTypeId} from "./DataTypes";
import {Subscription} from "./Subscription";
import {ArticleManager} from "./ArticleManager";
import {SubscriptionManager} from "./SubscriptionManager";
import {$id, bindMarkup} from "./Utils";

export class UIManager {
    subscriptionManager = new SubscriptionManager();
    articleManager = new ArticleManager();
    private subscription: Subscription;

    keywordToId = {};
    idCount = 1;

    settingsDivId = this.getHTMLId("settingsDiv");
    settingsBtnId = this.getHTMLId("settingsBtn");
    settingsDivContainerId = this.getHTMLId("settingsDivContainer");
    closeBtnId = this.getHTMLId("CloseSettingsBtn");
    enableFilteringCheckId = this.getHTMLId("enableFiltering");
    enableRestrictingCheckId = this.getHTMLId("enableRestricting");
    sortingTypeId = this.getHTMLId("sortingType");
    sortingEnabledId = this.getHTMLId("sortingEnabled");
    
    setUpSettingsMenu() {
        this.initSettingsMenu();
        this.initSettingsBtns();
        this.setUpSettingsMenuEvents();
    }

    initSettingsMenu() {
        var marginElementClass = this.getHTMLId("margin_element");
        var tabsMenuId = this.getHTMLId("tabs_menu");
        var tabsContentContainerId = this.getHTMLId("tabs_content");

        var settingsHtml = bindMarkup(templates.settingsHTML, [
            { name: "closeIconLink", value: cst.closeIconLink },
            { name: "SortingType.PopularityDesc", value: SortingType.PopularityDesc },
            { name: "SortingType.TitleAsc", value: SortingType.TitleAsc },
            { name: "SortingType.PopularityAsc", value: SortingType.PopularityAsc },
            { name: "SortingType.TitleDesc", value: SortingType.TitleDesc },
            { name: "FilteringList.Type.FilteredOut", value: this.getFilteringListHTML(FilteringType.FilteredOut) },
            { name: "FilteringList.Type.RestrictedOn", value: this.getFilteringListHTML(FilteringType.RestrictedOn) }
        ]);
        $("body").prepend(settingsHtml);

        // set up tabs
        $("#" + tabsMenuId + " a").click(function (event) {
            event.preventDefault();
            $(this).parent().addClass("current");
            $(this).parent().siblings().removeClass("current");
            var tab = $(this).attr("href");
            $("#" + tabsContentContainerId + " > div").not(tab).css("display", "none");
            $(tab).show();
        });
        var firstDiv = $("#" + tabsContentContainerId + " > div").first().show();
    }

    getFilteringListHTML(type: FilteringType): string {
        var ids = this.getIds(type);
        var filteringList = this.subscription.getFilteringList(type);
        
        var filteringKeywordsHTML = "";
        for (var i = 0; i < filteringList.length; i++) {
            var keyword = filteringList[i];
            var keywordId = this.getKeywordId(ids.typeId, keyword);
            var filteringKeywordHTML = bindMarkup(templates.filteringKeywordHTML, [
                { name: "keywordId", value: keywordId },
                { name: "keyword", value: keyword }
            ]);
            filteringKeywordsHTML += filteringKeywordHTML;
        }
        
        var filteringListHTML = bindMarkup(templates.filteringListHTML, [
            { name: "FilteringTypeTabId", value: this.getFilteringTypeTabId(type) },
            { name: "plusBtnId", value: this.getHTMLId(ids.plusBtnId) },
            { name: "plusIconLink", value: cst.plusIconLink },
            { name: "eraseBtnId", value: this.getHTMLId(ids.eraseBtnId) },
            { name: "eraseIconLink", value: cst.eraseIconLink },
            { name: "filetring.keywords", value: filteringKeywordsHTML }
        ]);
        return filteringListHTML;
    }

    initSettingsBtns() {
        var this_ = this;
        $(cst.settingsBtnPredecessorSelector).each(function (i, element) {
            var clone = $(element).clone();
            $(clone).attr('id', this_.getBtnId(element.id));
            $(clone).attr('src', cst.filterIconLink);
            $(clone).attr('alt', 'icon');
            $(clone).attr('data-page-action', '');
            $(element).after(clone);

            $(clone).click(function () {
                $id(this_.settingsDivContainerId).toggle();
            });
        });
    }

    setUpSettingsMenuEvents() {
        var this_ = this;

        // Set checkbox & select boxes correct state
        var filteringCheck = $id(this.enableFilteringCheckId);
        var restrictingCheck = $id(this.enableRestrictingCheckId);
        var sortingCheck = $id(this.sortingEnabledId);
        var sortingTypeSelect = $id(this.sortingTypeId);
        filteringCheck.prop('checked', this.subscription.isFilteringEnabled());
        restrictingCheck.prop('checked', this.subscription.isRestrictingEnabled());
        sortingCheck.prop('checked', this.subscription.isSortingEnabled());
        sortingTypeSelect.val(this.subscription.getSortingType());

        // Checkbox & select boxes events
        filteringCheck.change(function () {
            this_.subscription.setFilteringEnabled($(this).is(':checked'));
            this_.refreshTopics();
        });
        restrictingCheck.change(function () {
            this_.subscription.setRestrictingEnabled($(this).is(':checked'));
            this_.refreshTopics();
        });
        sortingCheck.change(function () {
            this_.subscription.setSortingEnabled($(this).is(':checked'));
            this_.refreshTopics();
        });
        sortingTypeSelect.change(function () {
            this_.subscription.setSortingType(sortingTypeSelect.val());
            this_.refreshTopics();
        });

        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
        })

        this.setUpFilteringListEvents();
    }

    refreshFilteringList(type: FilteringType) {
        var keywordListHtml = this.getFilteringListHTML(type);
        $id(this.getFilteringTypeTabId(type)).replaceWith(keywordListHtml);
        $id(this.getFilteringTypeTabId(type)).show();

        this.refreshTopics();
        this.setUpFilteringListEvents();
    }

    private setUpFilteringListEvents() {
        getFilteringTypes().forEach(this.setUpFilteringListTypeEvents, this);
    }

    private setUpFilteringListTypeEvents(type: FilteringType) {
        var ids = this.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);

        $id(this.getHTMLId(ids.plusBtnId)).click(() => {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                this.subscription.addKeyword(keyword, type);
                this.refreshFilteringList(type);
            }
        });

        // Erase button event
        $id(this.getHTMLId(ids.eraseBtnId)).click(() => {
            if (confirm("Erase all the keyword of this list ?")) {
                this.subscription.reset(type);
                this.refreshFilteringList(type);
            }
        });

        // Keyword buttons events
        var t = this;
        for (var i = 0; i < keywordList.length; i++) {
            var keywordId = this.getKeywordId(ids.typeId, keywordList[i]);
            $id(keywordId).click(function () {
                var keyword = $(this).text();
                if (confirm("Delete the keyword ?")) {
                    t.subscription.removeKeyword(keyword, type);
                    t.refreshFilteringList(type);
                }
            });
        }
    }

    refreshTopics() {
        this.articleManager.resetSorting();
        $(cst.topicSelector).toArray().forEach(this.articleManager.refreshTopic, this.articleManager);
    }

    getHTMLId(id: string) {
        return "FFnS_" + id;
    }

    getKeywordId(keywordListId: string, keyword: string) {
        if (!(keyword in this.keywordToId)) {
            var id = this.idCount++;
            this.keywordToId[keyword] = id;
        }
        return this.getHTMLId(keywordListId + "_" + this.keywordToId[keyword]);
    }

    getBtnId(elementId: string): string {
        return this.getHTMLId(this.settingsBtnId + "_" + elementId);
    }

    getFilteringTypeTabId(filteringType: FilteringType) {
        return this.getHTMLId("tab_" + FilteringType[filteringType]);
    }

    refreshPage() {
        this.refreshSubscription()
        this.resetSorting();
    }

    refreshSubscription() {
        var url = document.URL;
        this.subscription = this.subscriptionManager.updateSubscription(url);
        this.articleManager.setSubscription(this.subscription);
    }

    resetSorting() {
        this.articleManager.resetSorting();
    }

    refreshTopic(topicNode: Node) {
        this.articleManager.refreshTopic(topicNode);
    }

    getIds(type: FilteringType) {
        var id = getFilteringTypeId(type);
        return {
            typeId: "Keywords_" + id,
            plusBtnId: "Add_" + id,
            eraseBtnId: "DeleteAll_" + id
        };
    }

}
