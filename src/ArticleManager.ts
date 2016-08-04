/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionManager} from "./SubscriptionManager";

export class ArticleManager {
    subscriptionManager: SubscriptionManager;
    articlesCount = 0;
    hiddenCount = 0;
    minReadArticleAge = -1;
    lastReadArticle: JQuery;
    hiddingInfoClass = "FFnS_Hidding_Info";

    constructor(subscriptionManager: SubscriptionManager) {
        this.subscriptionManager = subscriptionManager;
    }

    refreshArticles() {
        this.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.addArticle, this);
    }

    resetArticles() {
        this.articlesCount = 0;
        this.hiddenCount = 0;
        this.minReadArticleAge = -1;
        this.lastReadArticle = null;
        $("." + this.hiddingInfoClass).remove();
    }

    getCurrentSub(): Subscription {
        return this.subscriptionManager.getCurrentSubscription();
    }

    getCurrentUnreadCount() {
        return this.subscriptionManager.getCurrentUnreadCount();
    }

    addArticle(articleNode: Node) {
        var article = $(articleNode);
        var sub = this.getCurrentSub();
        var title = article.attr(ext.articleTitleAttribute).toLowerCase();
        if (sub.isFilteringEnabled() || sub.isRestrictingEnabled()) {
            var restrictedOnKeywords = sub.getFilteringList(FilteringType.RestrictedOn);
            var filteredOutKeywords = sub.getFilteringList(FilteringType.FilteredOut);

            var hide = false;
            var restrictedCount = restrictedOnKeywords.length;
            if (sub.isRestrictingEnabled() && restrictedCount > 0) {
                hide = true;
                for (var i = 0; i < restrictedCount && hide; i++) {
                    if (title.indexOf(restrictedOnKeywords[i].toLowerCase()) != -1) {
                        hide = false;
                    }
                }
            }
            if (sub.isFilteringEnabled()) {
                for (var i = 0; i < filteredOutKeywords.length && !hide; i++) {
                    if (title.indexOf(filteredOutKeywords[i].toLowerCase()) != -1) {
                        hide = true;
                    }
                }
            }
            if (hide) {
                article.css("display", "none");
                this.hiddenCount++;
            } else {
                article.css("display", "");
            }
        } else {
            article.css("display", "");
        }

        var threshold = 6;
        var publishAge = this.getPublishAge(article);
        if (publishAge > threshold) {
            if (this.minReadArticleAge == -1 || publishAge < this.minReadArticleAge) {
                this.minReadArticleAge = publishAge;
                this.lastReadArticle = article;
                // console.log("new min age title: " + title);
            }
        } else {
            // article.css("display", "none");
            // this.hiddenCount++;
        }

        this.articlesCount++;
        this.checkLastAddedArticle(sub);
    }

    checkLastAddedArticle(sub: Subscription) {
        if (this.articlesCount == this.getCurrentUnreadCount()) {
            if (sub.isSortingEnabled()) {
                this.sortArticles();
            }
            $(ext.unreadCountSelector).append("<span class=" + this.hiddingInfoClass + ">(hidden: " + this.hiddenCount + ")</span>");
            var lastReadEntryId = null;
            if (this.lastReadArticle != null) {
                lastReadEntryId = $(this.lastReadArticle).attr(ext.articleEntryIdAttribute);
            }
            window["eval"]("window." + ext.lastReadEntryId + " = '" + lastReadEntryId + "';");
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

    getPublishAge(article: JQuery) : number {
        var ageStr = article.find(ext.publishAgeSelector).text().trim();
        var age = 1;
        if (ageStr.indexOf("h") > -1) {
            ageStr = ageStr.replace("h", "");
            age = Number(ageStr);
        } else if (ageStr.indexOf("d") > -1) {
            ageStr = ageStr.replace("d", "");
            age = Number(ageStr);
            age *= 24;
        }
        return age;
    }

    overrideMarkAsRead() {
        function getLastReadEntryId() : string {
            return window[ext.lastReadEntryId];
        }

        var feedlyListPagePrototype = window["devhd"].pkg("pages").ListPage.prototype;
        var oldMarkAllAsRead: Function = feedlyListPagePrototype.markAllSubscriptionEntriesAsRead;
        feedlyListPagePrototype.markAllSubscriptionEntriesAsRead = function (subURL: string, b, lastEntryObject, d) {
            console.log("oldMarkAllAsRead: " + oldMarkAllAsRead);
            console.log("subURL: " + subURL);
            console.log("lastEntryObject: " + JSON.stringify(lastEntryObject));
            console.log("lastReadEntryId: " + lastEntryObject["lastReadEntryId"]);
            
            lastEntryObject.lastReadEntryId = getLastReadEntryId();
            console.log("new lastReadEntryId: " + lastEntryObject["lastReadEntryId"]);
            // oldMarkAllAsRead.call(this, subURL, b, lastEntryObject, d);
        }
        var oldMarkCategoryAsRead: Function = feedlyListPagePrototype.markCategoryAsRead;
        feedlyListPagePrototype.markCategoryAsRead = function (categoryName: string, lastEntryObject, c, d) {
            console.log("oldMarkCategoryAsRead: " + oldMarkCategoryAsRead);
            console.log("categoryName: " + categoryName);
            console.log("lastEntryObject: " + JSON.stringify(lastEntryObject));
            console.log("lastReadEntryId: " + lastEntryObject["lastReadEntryId"]);

            lastEntryObject.lastReadEntryId = getLastReadEntryId();
            console.log("new lastReadEntryId: " + lastEntryObject["lastReadEntryId"]);
            // oldMarkCategoryAsRead.call(this, categoryName, lastEntryObject, c, d);
        }
    }

}
