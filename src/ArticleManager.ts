/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";

export class ArticleManager {
    titles = [];
    nbrRecommendationsArray = [];
    private subscription: Subscription;

    setSubscription(subscription: Subscription) {
        this.subscription = subscription;
    }

    resetSorting() {
        this.titles = [];
        this.nbrRecommendationsArray = [];
    }

    refreshTopic(topicNode: Node) {
        var topic = $(topicNode);
        var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
        if (this.subscription.isFilteringEnabled() || this.subscription.isRestrictingEnabled()) {
            var restrictedOnKeywords = this.subscription.getFilteringList(FilteringType.RestrictedOn);
            var filteredOutKeywords = this.subscription.getFilteringList(FilteringType.FilteredOut);

            var keep = false;
            var restrictedCount = restrictedOnKeywords.length;
            if (this.subscription.isRestrictingEnabled() && restrictedCount > 0) {
                keep = true;
                for (var i = 0; i < restrictedCount && keep; i++) {
                    if (title.indexOf(restrictedOnKeywords[i].toLowerCase()) != -1) {
                        keep = false;
                    }
                }
            }
            if (this.subscription.isFilteringEnabled()) {
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

        if (this.subscription.isSortingEnabled()) {
            this.sortTopic(topic);
        }
    }

    sortTopic(topic: JQuery) {
        var sortingType = this.subscription.getSortingType();
        if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
            var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
            this.titles.push(title);
            this.titles.sort();
            if (sortingType == SortingType.TitleDesc) {
                this.titles.reverse();
            }
            var index = jQuery.inArray(title, this.titles);
            this.insertIndex(topic, index);
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
            this.nbrRecommendationsArray.sort(function (a, b) {
                var i = ((sortingType == SortingType.PopularityAsc) ? -1 : 1);
                return (b - a) * i;
            });
            index = this.nbrRecommendationsArray.lastIndexOf(nbrRecommendations);
            this.insertIndex(topic, index);
        }
    }
    
    insertIndex(element: JQuery, i: number) {
        // The elemen0t we want to swap with
        var $target = element.parent().children().eq(i);

        // Determine the direction of the appended index so we know what side to place it on
        if (element.index() > i) {
            $target.before(element);
        } else {
            $target.after(element);
        }
    }
}
