/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType} from "./DataTypes";
import {Subscription} from "./Subscription";

export class ArticleManager {
    titles = [];
    popularityArray = [];
    private subscription: Subscription;

    setSubscription(subscription: Subscription) {
        this.subscription = subscription;
    }

    resetArticles() {
        this.titles = [];
        this.popularityArray = [];
    }

    addArticle(articleNode: Node) {
        var article = $(articleNode);
        var title = article.attr(ext.articleTitleAttribute).toLowerCase();
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
                article.css("display", "none");
            } else {
                article.css("display", "");
            }
        } else {
            article.css("display", "");
        }

        if (this.subscription.isSortingEnabled()) {
            this.sortArticle(article);
        }
    }

    sortArticle(article: JQuery) {
        var sortingType = this.subscription.getSortingType();
        if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
            var title = article.attr(ext.articleTitleAttribute).toLowerCase();
            this.titles.push(title);
            this.titles.sort();
            if (sortingType == SortingType.TitleDesc) {
                this.titles.reverse();
            }
            var index = jQuery.inArray(title, this.titles);
            this.insertIndex(article, index);
        }
        else if (sortingType == SortingType.PopularityAsc || sortingType == SortingType.PopularityDesc) {
            var popularityStr = article.find(ext.popularitySelector).text().trim();
            popularityStr = popularityStr.replace("+", "");
            if (popularityStr.indexOf("K") > -1) {
                popularityStr = popularityStr.replace("K", "");
                popularityStr += "000";
            }
            var popularityNumber = Number(popularityStr);
            if (popularityNumber < 100) {
                popularityNumber = 1;
            }
            this.popularityArray.push(popularityNumber);
            this.popularityArray.sort(function (a, b) {
                var i = ((sortingType == SortingType.PopularityAsc) ? -1 : 1);
                return (b - a) * i;
            });
            index = this.popularityArray.lastIndexOf(popularityNumber);
            this.insertIndex(article, index);
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
