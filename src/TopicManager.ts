/// <reference path="./_references.d.ts" />
import {Subscription} from "./_references";
import {DAO} from "./DAO";
import {SortingType} from "./Subscription";
import {FilteringType} from "./Subscription";
import {FilteringTypeIds} from "./Subscription";
import {callbackBind} from "./Utils";
import {$id} from "./Utils";
import {insertIndex} from "./Utils";

export class TopicManager {
    titles = [];
    nbrRecommendationsArray = [];
    subscription: Subscription;

    constructor(subscription: Subscription) {
        this.subscription = subscription;
    }

    resetSorting() {
        this.titles = [];
        this.nbrRecommendationsArray = [];
    }

    refreshFilteringList(type: FilteringType) {
        var keywordListHtml = this.filteringListHTML(type);
        var keywordListId = this.subscription.getIds(type).typeId;
        $id(keywordListId).replaceWith(keywordListHtml);

        this.refreshTopics();
        this.subscription.save(type);
        this.setUpFilteringListEvents();
    }

    getId(keywordListId, keyword) {
        return keywordListId + "_" + keyword;
    }

    filteringListHTML(type: FilteringType): string {
        var ids = this.subscription.getIds(type);
        var filteringList = this.subscription.getFilteringList(type);

        var result = "<span id=" + ids.typeId + ">";

        // keyword list
        for (var i = 0; i < filteringList.length; i++) {
            var keyword = filteringList[i];
            var keywordId = this.getId(ids.typeId, keyword);
            result += '<button id="' + keywordId + '" type="button" style="' + cst.keywordTagStyle + '">' + keyword + '</button>';
        }

        // plus button
        result += '<span id="' + ids.plusBtnId + '" > <img src="' + cst.plusIconLink + '" style="' + cst.iconStyle + '" /></span>';

        // Erase button
        result += '<span id="' + ids.eraseBtnId + '" > <img src="' + cst.eraseIconLink + '" style="' + cst.iconStyle + '" /></span>';

        result += "</span>";
        return result;
    }

    setUpFilteringListEvents() {
        this.subscription.forEachFilteringType(this.setUpFilteringListTypeEvents, this);
    }

    setUpFilteringListTypeEvents(type: FilteringType) {
        var ids = this.subscription.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);
        var refreshKeywordList = this.refreshFilteringList;
        refreshKeywordList.bind(this);

        $id(ids.plusBtnId).click(function() {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                keywordList.push(keyword);
                refreshKeywordList(type);
            }
        });

        // Erase button event
        $id(ids.eraseBtnId).click(function() {
            if (confirm("Erase all the keyword of this list ?")) {
                keywordList.length = 0;
                refreshKeywordList(type);
            }
        });

        // Keyword buttons events
        for (var i = 0; i < keywordList.length; i++) {
            var keywordId = this.getId(ids.typeId, keywordList[i]);
            $id(keywordId).click(function() {
                var keyword = $(this).text();
                if (confirm("Delete the keyword ?")) {
                    var index = keywordList.indexOf(keyword);
                    if (index > -1) {
                        keywordList.splice(index, 1);
                        refreshKeywordList(type);
                    }
                }
            });
        }
    }

    refreshTopics() {
        this.resetSorting();
        $(cst.topicSelector).toArray().forEach(this.refreshTopic, this);
    }

    refreshTopic(topicNode) {
        var topic = $(topicNode);
        var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
        if (this.subscription.filteringEnabled || this.subscription.restrictingEnabled) {
            var restrictedOnKeywords = this.subscription.getFilteringList(FilteringType.RestrictedOn);
            var filteredOutKeywords = this.subscription.getFilteringList(FilteringType.FilteredOut);

            var keep = false;
            var restrictedCount = restrictedOnKeywords.length;
            if (this.subscription.restrictingEnabled && restrictedCount > 0) {
                keep = true;
                for (var i = 0; i < restrictedCount && keep; i++) {
                    if (title.indexOf(restrictedOnKeywords[i].toLowerCase()) != -1) {
                        keep = false;
                    }
                }
            }
            if (this.subscription.filteringEnabled) {
                for (var i = 0; i < filteredOutKeywords.length && !keep; i++) {
                    if (title.indexOf(filteredOutKeywords[i].toLowerCase()) != -1) {
                        keep = true;
                    }
                }
            }
            if (keep) {
                topic.css("display", "none");
            } else {
                topic.css("display", "");
            }
        } else {
            topic.css("display", "");
        }

        if (this.subscription.sortingEnabled) {
            this.sortTopic(topic);
        }
    }

    sortTopic(topic: JQuery) {
        var sortingType = this.subscription.sortingType;
        if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
            var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
            this.titles.push(title);
            this.titles.sort();
            if (sortingType == SortingType.TitleDesc) {
                this.titles.reverse();
            }
            var index = jQuery.inArray(title, this.titles);
            insertIndex(topic, index);
        }
        else if (sortingType == SortingType.PopularityAsc || sortingType == SortingType.PopularityDesc) {
            var nbrRecommendationsStr = topic.find(cst.nbrRecommendationsSelector).text().trim();
            nbrRecommendationsStr = nbrRecommendationsStr.replace("+", "");
            if (nbrRecommendationsStr.indexOf("K") > -1) {
                nbrRecommendationsStr = nbrRecommendationsStr.replace("K", "");
                nbrRecommendationsStr += "000";
            }
            var nbrRecommendations = Number(nbrRecommendationsStr);
            if (nbrRecommendations < 100) {
                nbrRecommendations = 1;
            }
            this.nbrRecommendationsArray.push(nbrRecommendations);
            this.nbrRecommendationsArray.sort(function(a, b) {
                var i = ((sortingType == SortingType.PopularityAsc) ? -1 : 1);
                return (b - a) * i;
            });
            index = this.nbrRecommendationsArray.lastIndexOf(nbrRecommendations);
            insertIndex(topic, index);
        }
    }
}
