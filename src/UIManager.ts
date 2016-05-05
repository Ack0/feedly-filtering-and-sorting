/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import {Subscription, FilteringType, SortingType} from "./Subscription";
import {TopicManager} from "./TopicManager";
import {$id} from "./Utils";

export class UIManager {
    topicManager: TopicManager = new TopicManager();
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
        var settingsDiv =
            '<div id="' + this.settingsDivContainerId + '" >' +
            '<div id="' + this.settingsDivId + '" >' +

            // Close btn
            '<img id="' + this.closeBtnId + '" src="' + cst.closeIconLink + '" style="float:right;display:inline-block;width: 24px; height: 24px;" class="pageAction requiresLogin"/>' +

            // Checkbox to enable filtering
            '<span>' +
            '<span class="FFnS_settings_span">Filtering enabled</span>' +
            '<input id="' + this.enableFilteringCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</span>' +

            // Checkbox to enable restricting
            '<span class="' + marginElementClass + '">' +
            '<span class="FFnS_settings_span">Restricting enabled</span>' +
            '<input id="' + this.enableRestrictingCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</span>' +

            // Checkbox to enable sorting
            '<span class="' + marginElementClass + '">' +
            '<span class="FFnS_settings_span">Sorting enabled</span>' +
            '<input id="' + this.sortingEnabledId + '" type="checkbox" style="vertical-align: middle;">' +

            // Combo box sorting type
            '<select id=' + this.sortingTypeId + ' class="' + marginElementClass + '" style="vertical-align: middle; font-size:12px;">' +
            '<option value="' + SortingType.PopularityDesc + '">Sort by number of recommendations (highest to lowest)</option>' +
            '<option value="' + SortingType.TitleAsc + '">Sort by title (a -> z)</option>' +
            '<option value="' + SortingType.PopularityAsc + '">Sort by number of recommendations (lowest to highest)</option>' +
            '<option value="' + SortingType.TitleDesc + '">Sort by title (z -> a)</option>' +
            '</select>' +
            '</span>' +

            // Filtering tabs
            '<ul id="' + tabsMenuId + '">' +
                '<li class="current"><a href="#' + this.getFilteringTypeTabId(FilteringType.FilteredOut) + '">Filtering (Keywords the feeds must not contain)</a></li>' +
                '<li><a href="#' + this.getFilteringTypeTabId(FilteringType.RestrictedOn) + '">Restricting (Keywords the the feeds must contain)</a></li>' +
            '</ul>' +
            '<div id="' + tabsContentContainerId + '">' +
            this.getFilteringListHTML(FilteringType.FilteredOut) +
            this.getFilteringListHTML(FilteringType.RestrictedOn) +
            '</div>' +

            '</div>' +
            '</div>';
        $("body").prepend(settingsDiv);

        // set up tabs
        $("#" + tabsMenuId + " a").click(function(event) {
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
        var ids = this.subscription.getIds(type);
        var filteringList = this.subscription.getFilteringList(type);

        // plus button
        var result = '<div id="' + this.getFilteringTypeTabId(type) + '" class="FFnS_FilteringList">' +
        '<span id="' + this.getHTMLId(ids.plusBtnId) + '" > <img src="' + cst.plusIconLink + '" class="FFnS_icon" /></span>';

        // Erase button
        result += '<span id="' + this.getHTMLId(ids.eraseBtnId) + '" > <img src="' + cst.eraseIconLink + '" class="FFnS_icon" /></span>';

        // keyword list
        for (var i = 0; i < filteringList.length; i++) {
            var keyword = filteringList[i];
            var keywordId = this.getKeywordId(ids.typeId, keyword);
            result += '<button id="' + keywordId + '" type="button" class="FFnS_keyword">' + keyword + '</button>';
        }

        result += "</div>";
        return result;
    }

    initSettingsBtns() {
        var this_ = this;
        $(cst.settingsBtnPredecessorSelector).each(function(i, element) {
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

        $id(this.closeBtnId).click(function() {
            $id(this_.settingsDivContainerId).toggle();
        })

        this.setUpFilteringListEvents();
    }

    refreshFilteringList(type: FilteringType) {
        var keywordListHtml = this.getFilteringListHTML(type);
        var keywordListId = this.subscription.getIds(type).typeId;
        $id(this.getFilteringTypeTabId(type)).replaceWith(keywordListHtml);
        $id(this.getFilteringTypeTabId(type)).show();

        this.refreshTopics();
        this.subscription.save(type);
        this.setUpFilteringListEvents();
    }

    private setUpFilteringListEvents() {
        this.subscription.forEachFilteringType(this.setUpFilteringListTypeEvents, this);
    }

    private setUpFilteringListTypeEvents(type: FilteringType) {
        var ids = this.subscription.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);

        $id(this.getHTMLId(ids.plusBtnId)).click(() => {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                keywordList.push(keyword);
                this.refreshFilteringList(type);
            }
        });

        // Erase button event
        $id(this.getHTMLId(ids.eraseBtnId)).click(() => {
            if (confirm("Erase all the keyword of this list ?")) {
                keywordList.length = 0;
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
                    var index = keywordList.indexOf(keyword);
                    if (index > -1) {
                        keywordList.splice(index, 1);
                        t.refreshFilteringList(type);
                    }
                }
            });
        }
    }

    refreshTopics() {
        this.topicManager.resetSorting();
        $(cst.topicSelector).toArray().forEach(this.topicManager.refreshTopic, this.topicManager);
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

    getBtnId (elementId: string): string {
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
        console.log("url changed: " + url);
        this.subscription = new Subscription("");
        this.topicManager.setSubscription(this.subscription);
    }

    resetSorting() {
        this.topicManager.resetSorting();
    }

    refreshTopic(topicNode: Node) {
        this.topicManager.refreshTopic(topicNode);
    }

}
