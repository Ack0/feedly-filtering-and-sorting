/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionManager} from "./SubscriptionManager";

export class ArticleManager {
    articlesCount = 0;
    subscriptionManager: SubscriptionManager;

    constructor(subscriptionManager: SubscriptionManager) {
        this.subscriptionManager = subscriptionManager;
    }

    refreshArticles() {
        this.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.addArticle, this);
    }

    resetArticles() {
        this.articlesCount = 0;
    }

    getCurrentSub(): Subscription {
        return this.subscriptionManager.getCurrentSubscription();
    }

    getCurrentUnreadCount() {
        return this.subscriptionManager.getCurrentUnreadCount();
    }

    addArticle(articleNode: Node) {
        var article = $(articleNode);
        var title = article.attr(ext.articleTitleAttribute).toLowerCase();
        if (this.getCurrentSub().isFilteringEnabled() || this.getCurrentSub().isRestrictingEnabled()) {
            var restrictedOnKeywords = this.getCurrentSub().getFilteringList(FilteringType.RestrictedOn);
            var filteredOutKeywords = this.getCurrentSub().getFilteringList(FilteringType.FilteredOut);

            var keep = false;
            var restrictedCount = restrictedOnKeywords.length;
            if (this.getCurrentSub().isRestrictingEnabled() && restrictedCount > 0) {
                keep = true;
                for (var i = 0; i < restrictedCount && keep; i++) {
                    if (title.indexOf(restrictedOnKeywords[i].toLowerCase()) != -1) {
                        keep = false;
                    }
                }
            }
            if (this.getCurrentSub().isFilteringEnabled()) {
                for (var i = 0; i < filteredOutKeywords.length && !keep; i++) {
                    if (title.indexOf(filteredOutKeywords[i].toLowerCase()) != -1) {
                        keep = true;
                    }
                }
            }
            if (keep) {
                article.css("display", "none");
            } else {
                article.css("display", "");
            }
        } else {
            article.css("display", "");
        }

        this.articlesCount++;
        if (this.getCurrentSub().isSortingEnabled() && this.articlesCount == this.getCurrentUnreadCount()) {
            this.sortArticles();
        }
    }

    sortArticles() {
        var sortingType = this.getCurrentSub().getSortingType();
        var articlesArray: Node[] = $(ext.articleSelector).toArray();
        articlesArray.sort((a: Node, b: Node) => {
            if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
                var titleA = this.getTitle(a);
                var titleB = this.getTitle(b);
                var sorting = titleA === titleB ? 0 : (titleA > titleB ? 1 : -1);
                if (sortingType == SortingType.TitleDesc) {
                    sorting = sorting * -1;
                }
                return sorting;
            } else {
                var popA = this.getPopularity(a);
                var popB = this.getPopularity(b);
                var i = ((sortingType == SortingType.PopularityAsc) ? 1 : -1);
                return (popA - popB) * i;
            }
        });

        var parent = $(articlesArray[0]).parent();
        parent.empty();
        articlesArray.forEach((article) => {
            parent.append($(article));
        });
    }

    getTitle(article: Node): string {
        return $(article).attr(ext.articleTitleAttribute).toLowerCase();
    }

    getPopularity(article: Node): number {
        var popularityStr = $(article).find(ext.popularitySelector).text().trim();
        popularityStr = popularityStr.replace("+", "");
        if (popularityStr.indexOf("K") > -1) {
            popularityStr = popularityStr.replace("K", "");
            popularityStr += "000";
        }
        var popularityNumber = Number(popularityStr);
        if (popularityNumber < 100) {
            popularityNumber = 1;
        }
        return popularityNumber;
    }
}
