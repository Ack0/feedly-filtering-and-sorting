/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";
import {SubscriptionManager} from "./SubscriptionManager";
import {$id, isRadioChecked} from "./Utils";

export class ArticleManager {
    subscriptionManager: SubscriptionManager;
    articlesCount = 0;
    hiddenCount = 0;
    lastReadArticleAge = -1;
    lastReadArticleGroup: Article[];
    articlesToMarkAsRead: Article[];
    hiddingInfoClass = "FFnS_Hidding_Info";
    eval = window["eval"];

    constructor(subscriptionManager: SubscriptionManager) {
        this.subscriptionManager = subscriptionManager;
        this.eval("(" + this.overrideMarkAsRead.toString() + ")();");
        this.eval("window.ext = (" + JSON.stringify(ext).replace(/\s+/g, ' ') + ");");
    }

    refreshArticles() {
        this.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.addArticle, this);
    }

    resetArticles() {
        this.articlesCount = 0;
        this.hiddenCount = 0;
        this.lastReadArticleAge = -1;
        this.lastReadArticleGroup = [];
        this.articlesToMarkAsRead = [];
        $("." + this.hiddingInfoClass).remove();
        this.eval("window.FFnS = ({});");
    }

    getCurrentSub(): Subscription {
        return this.subscriptionManager.getCurrentSubscription();
    }

    getCurrentUnreadCount() {
        return this.subscriptionManager.getCurrentUnreadCount();
    }

    addArticle(articleNode: Node) {
        var article = new Article(articleNode);
        var sub = this.getCurrentSub();
        var title = article.getTitle();
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

        var advControls = sub.getAdvancedControlsReceivedPeriod();
        var threshold = Date.now() - advControls.maxHours * 3600 * 1000;
        var publishAge = article.getPublishAge();
        if (publishAge <= threshold) {
            if (advControls.keepUnread && (this.lastReadArticleAge == -1 ||
                publishAge >= this.lastReadArticleAge)) {
                if (publishAge != this.lastReadArticleAge) {
                    this.lastReadArticleGroup = [article]
                } else {
                    this.lastReadArticleGroup.push(article);
                }
                this.lastReadArticleAge = publishAge;
            }
        } else {
            if (advControls.hide) {
                if (advControls.showIfHot && (article.isArticleHot()
                    || article.getPopularity() >= advControls.minPopularity)) {
                    if (advControls.keepUnread && advControls.markAsReadVisible) {
                        this.articlesToMarkAsRead.push(article);
                    }
                } else {
                    article.css("display", "none");
                    this.hiddenCount++;
                }
            }
        }

        this.articlesCount++;
        this.checkLastAddedArticle(sub);
    }

    checkLastAddedArticle(sub: Subscription) {
        if (this.articlesCount == this.getCurrentUnreadCount()) {
            if (this.lastReadArticleGroup.length > 0) {
                var lastReadArticle: Article;
                if (this.isOldestFirst()) {
                    lastReadArticle = this.lastReadArticleGroup[this.lastReadArticleGroup.length - 1];
                } else {
                    lastReadArticle = this.lastReadArticleGroup[0];
                }
                if (lastReadArticle != null) {
                    this.putWindow(ext.lastReadEntryId, lastReadArticle.getEntryId());
                }
            }
            if (this.articlesToMarkAsRead.length > 0) {
                var ids = this.articlesToMarkAsRead.map<string>((article) => {
                    return article.getEntryId();
                })
                this.putWindow(ext.articlesToMarkAsReadId, ids);
            }
            if (sub.isSortingEnabled()) {
                this.sortArticles();
            }
            if (sub.getAdvancedControlsReceivedPeriod().keepUnread) {
                this.putWindow(ext.keepNewArticlesUnreadId, true);
            }

            $(ext.unreadCountSelector).append("<span class=" + this.hiddingInfoClass + ">(hidden: " + this.hiddenCount + ")</span>");
        }
    }

    sortArticles() {
        var sortingType = this.getCurrentSub().getSortingType();
        var articlesArray: Article[] = $.map<Node, Article>($(ext.articleSelector).toArray(), ((node) => {
            return new Article(node);
        }));
        articlesArray.sort((a: Article, b: Article) => {
            if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
                var titleA = a.getTitle();
                var titleB = b.getTitle();
                var sorting = titleA === titleB ? 0 : (titleA > titleB ? 1 : -1);
                if (sortingType == SortingType.TitleDesc) {
                    sorting = sorting * -1;
                }
                return sorting;
            } else {
                var popA = a.getPopularity();
                var popB = b.getPopularity();
                var i = ((sortingType == SortingType.PopularityAsc) ? 1 : -1);
                return (popA - popB) * i;
            }
        });

        var articlesContainer = $(ext.articleSelector).first().parent();
        articlesContainer.empty();
        articlesArray.forEach((article) => {
            articlesContainer.append(article.get());
        });
    }

    isOldestFirst(): boolean {
        var firstPublishAge = new Article($(ext.articleSelector).first().get(0)).getPublishAge();
        var lastPublishAge = new Article($(ext.articleSelector).last().get(0)).getPublishAge();
        return firstPublishAge < lastPublishAge;
    }

    putWindow(id: string, value: any) {
        this.eval("window.FFnS['" + id + "'] = " + JSON.stringify(value) + ";");
    }

    /* No JQuery */
    overrideMarkAsRead() {
        var pagesPkg = window["devhd"].pkg("pages");
        function getFromWindow(id: string) {
            return window["FFnS"][id];
        }
        function markEntryAsRead(id, thisArg) {
            pagesPkg.BasePage.prototype.buryEntry.call(thisArg, id);
        }
        function getLastReadEntry(oldLastEntryObject, thisArg) {
            if (getFromWindow(ext.keepNewArticlesUnreadId) == null) {
                return oldLastEntryObject;
            }
            var idsToMarkAsRead: string[] = getFromWindow(ext.articlesToMarkAsReadId);
            if (idsToMarkAsRead != null) {
                idsToMarkAsRead.forEach(id => {
                    markEntryAsRead(id, thisArg)
                });
            }
            var lastReadEntryId = getFromWindow(ext.lastReadEntryId);
            if (lastReadEntryId == null) {
                return null;
            }
            return { lastReadEntryId: lastReadEntryId };
        }

        var feedlyListPagePrototype = pagesPkg.ListPage.prototype;
        var oldMarkAllAsRead: Function = feedlyListPagePrototype.markAllSubscriptionEntriesAsRead;
        feedlyListPagePrototype.markAllSubscriptionEntriesAsRead = function (subURL: string, b, oldLastEntryObject, d) {
            var lastEntryObject = getLastReadEntry(oldLastEntryObject, this);
            if (lastEntryObject != null) {
                oldMarkAllAsRead.call(this, subURL, b, lastEntryObject, d);
            }
        }
        var oldMarkCategoryAsRead: Function = feedlyListPagePrototype.markCategoryAsRead;
        feedlyListPagePrototype.markCategoryAsRead = function (categoryName: string, oldLastEntryObject, c, d) {
            var lastEntryObject = getLastReadEntry(oldLastEntryObject, this);
            if (lastEntryObject != null) {
                oldMarkCategoryAsRead.call(this, categoryName, lastEntryObject, c, d);
            }
        }
    }

}

class Article {
    private article: JQuery;

    constructor(article: Node) {
        this.article = $(article);
    }

    get(): JQuery {
        return this.article;
    }

    getTitle(): string {
        return this.article.attr(ext.articleTitleAttribute).toLowerCase();
    }

    getPopularity(): number {
        var popularityStr = this.article.find(ext.popularitySelector).text().trim();
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

    getPublishAge(): number {
        var ageTitle = this.article.find(ext.publishAgeSpanSelector).attr("title");
        var publishDate = ageTitle.split("--")[1].trim().replace("Received:", "").trim();
        var publishDateMs = Date.parse(publishDate);
        return publishDateMs;
    }

    isArticleHot(): boolean {
        var span = this.article.find(ext.popularitySelector);
        return span.hasClass("hot") || span.hasClass("onfire");
    }

    getEntryId(): string {
        return this.article.attr(ext.articleEntryIdAttribute);
    }

    css(propertyName: string, value?: string | number) {
        this.article.css(propertyName, value);
    }
}
