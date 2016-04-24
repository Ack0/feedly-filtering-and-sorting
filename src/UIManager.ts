/// <reference path="./_references.d.ts" />

import * as cst from "constants";
import {Subscription, FilteringType, SortingType} from "./Subscription";
import {TopicManager} from "./TopicManager";
import {$id} from "./Utils";

export class UIManager {
    topicManager: TopicManager = new TopicManager();
    private subscription: Subscription;
    settingsBtnId = "settingsBtn";
    settingsDivContainerId = "settingsDivContainer";
    closeBtnId = "CloseSettingsBtn";
    enableFilteringCheckId = "enableFiltering";
    enableRestrictingCheckId = "enableRestricting";
    sortingTypeId = "sortingType";
    sortingEnabledId: "sortingEnabled";
    keywordToId = {};
    idCount = 1;

    setUpSettingsMenu() {
        this.initSettingsMenu();
        this.initSettingsBtns();
        this.setUpSettingsMenuEvents();
    }

    initSettingsMenu() {
        var settingsDivId = "settingsDiv";
        var settingsDiv =
            '<div id="' + this.settingsDivContainerId + '" >' +
            '<div id="' + settingsDivId + '" >' +

            '<div>' +
            // Close btn
            '<img id="' + this.closeBtnId + '" src="' + cst.closeIconLink + '" style="float:right;display:inline-block;width: 24px; height: 24px;" class="pageAction requiresLogin"/>' +

            // Checkbox to enable filtering
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtering enabled</span>' +
            '<input id="' + this.enableFilteringCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +

            // Checkbox to enable restricting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricting enabled</span>' +
            '<input id="' + this.enableRestrictingCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +

            // Checkbox to enable sorting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Sorting enabled</span>' +
            '<input id="' + this.sortingEnabledId + '" type="checkbox" style="vertical-align: middle;">' +
            '<select id=' + this.sortingTypeId + '>' +
            '<option value="' + SortingType.PopularityDesc + '">Sort by number of recommendations (highest to lowest)</option>' +
            '<option value="' + SortingType.TitleAsc + '">Sort by title (a -> z)</option>' +
            '<option value="' + SortingType.PopularityAsc + '">Sort by number of recommendations (lowest to highest)</option>' +
            '<option value="' + SortingType.TitleDesc + '">Sort by title (z -> a)</option>' +
            '</select>' +
            '</div>' +

            // Restricted on keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricted on keyword list: </span>' +
            this.getFilteringListHTML(FilteringType.RestrictedOn) +
            '</div>' +

            // Filtered out keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtered out keyword list: </span>' +
            this.getFilteringListHTML(FilteringType.FilteredOut) +
            '</div>' +

            '</div>' +
            '</div>';
        $("body").prepend(settingsDiv);
        $id(settingsDivId)
            .css('margin', '25px')
            .css('border-radius', '25px')
            .css('border', '2px solid #336699')
            .css('background', '#E0F5FF')
            .css('padding', '20px')
            .css('opacity', '1');
        $id(this.settingsDivContainerId)
            .css("display", "none")
            .css('background', 'rgba(0,0,0,0.9)')
            .css('width', '100%')
            .css('height', '100%')
            .css('z-index', '500')
            .css('top', '0')
            .css('left', '0')
            .css('position', 'fixed');
    }

    getFilteringListHTML(type: FilteringType): string {
        var ids = this.subscription.getIds(type);
        var filteringList = this.subscription.getFilteringList(type);

        var result = "<span id=" + ids.typeId + ">";

        // keyword list
        for (var i = 0; i < filteringList.length; i++) {
            var keyword = filteringList[i];
            var keywordId = this.getKeywordId(ids.typeId, keyword);
            result += '<button id="' + keywordId + '" type="button" style="' + cst.keywordTagStyle + '">' + keyword + '</button>';
        }

        // plus button
        result += '<span id="' + ids.plusBtnId + '" > <img src="' + cst.plusIconLink + '" style="' + cst.iconStyle + '" /></span>';

        // Erase button
        result += '<span id="' + ids.eraseBtnId + '" > <img src="' + cst.eraseIconLink + '" style="' + cst.iconStyle + '" /></span>';

        result += "</span>";
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
        $id(keywordListId).replaceWith(keywordListHtml);

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

        $id(ids.plusBtnId).click(() => {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                keywordList.push(keyword);
                this.refreshFilteringList(type);
            }
        });

        // Erase button event
        $id(ids.eraseBtnId).click(() => {
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

    getKeywordId(keywordListId: string, keyword: string) {
        if (!(keyword in this.keywordToId)) {
            var id = this.idCount++;
            this.keywordToId[keyword] = id;
        }
        return keywordListId + "_" + this.keywordToId[keyword];
    }

    getBtnId (elementId: string): string {
        return this.settingsBtnId + "_" + elementId;
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
