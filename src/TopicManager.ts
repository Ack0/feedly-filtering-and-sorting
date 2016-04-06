/// <reference path="./_references.d.ts" />
import {Subscription} from "./_references";
import {DAO} from "./DAO";

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

    refreshKeywordList(keywordList, keywordListId) {
        var keywordListHtml = this.getKeywordList(keywordList, keywordListId);
        this.$id(keywordListId).replaceWith(keywordListHtml);
        this.refreshTopics();

        this.subscription.getDAO().serialize(keywordListId, keywordList);
        this.setKeywordListEvents(keywordList, keywordListId);
    }


    $id(id) {
        return $('#' + id);
    }

    getId(keywordListId, keyword) {
        return keywordListId + "_" + keyword;
    }

    getKeywordList(keywordList, keywordListId) {
        var result = "<span id=" + keywordListId + ">";

        // keyword list
        for (var i = 0; i < keywordList.length; i++) {
            var keyword = keywordList[i];
            var keywordId = this.getId(keywordListId, keyword);
            result += '<button id="' + keywordId + '" type="button" style="' + cst.keywordTagStyle + '">' + keyword + '</button>';
        }

        // plus button
        var plusBtnId = this.subscription.keywords[keywordListId].plusBtnId;
        result += '<span id="' + plusBtnId + '" > <img src="' + cst.plusIconLink + '" style="' + cst.iconStyle + '" /></span>';

        // Erase button
        var eraseBtnId = this.subscription.keywords[keywordListId].eraseBtnId;
        result += '<span id="' + eraseBtnId + '" > <img src="' + cst.eraseIconLink + '" style="' + cst.iconStyle + '" /></span>';

        result += "</span>";
        return result;
    }
    setKeywordListEvents(keywordList, keywordListId) {
        // Plus button event
        var plusBtnId = this.subscription.keywords[keywordListId].plusBtnId;
        this.$id(plusBtnId).click(function() {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                keywordList.push(keyword);
                this.refreshKeywordList(keywordList, keywordListId);
            }
        });

        // Erase button event
        var eraseBtnId = this.subscription.keywords[keywordListId].eraseBtnId;
        this.$id(eraseBtnId).click(function() {
            if (confirm("Erase all the keyword of this list ?")) {
                this.keywords[keywordListId].list.length = 0;
                this.refreshKeywordList(keywordList, keywordListId);
            }
        });

        // Keyword buttons events
        for (var i = 0; i < keywordList.length; i++) {
            var keywordId = this.getId(keywordListId, keywordList[i]);
            this.$id(keywordId).click(function() {
                var keyword = $(this).text();
                if (confirm("Delete the keyword ?")) {
                    var index = keywordList.indexOf(keyword);
                    if (index > -1) {
                        keywordList.splice(index, 1);
                        this.refreshKeywordList(keywordList, keywordListId);
                    }
                }
            });
        }
    }

    refreshTopics() {
        this.resetSorting();
        $(cst.topicSelector).each(function() {
            this.refreshTopic($(this));
        });
    }
    refreshTopic(topic) {
        var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
        if (this.subscription.filteringEnabled || this.subscription.restrictingEnabled) {
            var keep = false;
            var restrictedCount = this.subscription.restrictedOnKeywords.length;
            if (this.subscription.restrictingEnabled && restrictedCount > 0) {
                keep = true;
                for (var i = 0; i < restrictedCount && keep; i++) {
                    if (title.indexOf(this.subscription.restrictedOnKeywords[i].toLowerCase()) != -1) {
                        keep = false;
                    }
                }
            }
            if (this.subscription.filteringEnabled) {
                for (var i = 0; i < this.subscription.filteredOutKeywords.length && !keep; i++) {
                    if (title.indexOf(this.subscription.filteredOutKeywords[i].toLowerCase()) != -1) {
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
    sortTopic(topic) {
        if (this.subscription.sortingType == 'titleAsc' || this.subscription.sortingType == 'titleDesc') {
            var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
            this.titles.push(title);
            this.titles.sort();
            if (this.subscription.sortingType == 'titleDesc') {
                this.titles.reverse();
            }
            var index = jQuery.inArray(title, this.titles);
            topic.insertIndex(index);
        } else if (this.subscription.sortingType == 'nbRecommendationsAsc' || this.subscription.sortingType == 'nbRecommendationsDesc') {
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
                var i = (this.subscription.sortingType == 'nbRecommendationsAsc' ? -1 : 1);
                return (b - a) * i;
            });
            index = this.nbrRecommendationsArray.lastIndexOf(nbrRecommendations);
            topic.insertIndex(index);
        }
    }
}
