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

    settingsDivContainerId = this.getHTMLId("settingsDivContainer");
    closeBtnId = this.getHTMLId("CloseSettingsBtn");
    enableFilteringCheckId = this.getHTMLId("enableFiltering");
    enableRestrictingCheckId = this.getHTMLId("enableRestricting");
    sortingTypeId = this.getHTMLId("sortingType");
    sortingEnabledId = this.getHTMLId("sortingEnabled");

    setUpSettingsMenu() {
        var urls = this.subscriptionManager.getAllSubscriptionURLs();
        this.initSettingsMenu();
        this.initSettingsBtns();
        this.setUpSettingsEvents();
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
            { name: "FilteringList.Type.RestrictedOn", value: this.getFilteringListHTML(FilteringType.RestrictedOn) },
            { name: "ImportMenu.SubscriptionOptions", value: this.getImportKeywordsSubscriptionOptions() }
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

        this.updateSettings();
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

    getImportKeywordsSubscriptionOptions(): string {
        var optionsHTML = "";
        var urls = this.subscriptionManager.getAllSubscriptionURLs();
        urls.forEach((url) => {
            optionsHTML += bindMarkup(templates.optionHTML, [{ name: "value", value: url }]);
        })
        return optionsHTML;
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

    setUpSettingsEvents() {
        var this_ = this;

        // Checkbox & select boxes events
        $id(this.enableFilteringCheckId).change(function () {
            this_.subscription.setFilteringEnabled($(this).is(':checked'));
            this_.refreshFilteringAndSorting();
        });
        $id(this.enableRestrictingCheckId).change(function () {
            this_.subscription.setRestrictingEnabled($(this).is(':checked'));
            this_.refreshFilteringAndSorting();
        });
        $id(this.sortingEnabledId).change(function () {
            this_.subscription.setSortingEnabled($(this).is(':checked'));
            this_.refreshFilteringAndSorting();
        });
        var sortingTypeSelect = $id(this.sortingTypeId);
        sortingTypeSelect.change(function () {
            this_.subscription.setSortingType(sortingTypeSelect.val());
            this_.refreshFilteringAndSorting();
        });

        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
        })

        $id("FFnS_ImportMenu_Submit").click(() => {
            this.importKeywords();
        });

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
                this.updateFilteringList(type);
            }
        });

        // Erase button event
        $id(this.getHTMLId(ids.eraseBtnId)).click(() => {
            if (confirm("Erase all the keyword of this list ?")) {
                this.subscription.reset(type);
                this.updateFilteringList(type);
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
                    t.updateFilteringList(type);
                }
            });
        }
    }

    updatePage() {
        this.resetPage();
        this.updateSubscription();
        this.updateMenu();
    }
    
    resetPage() {
        this.articleManager.resetArticles();
    }

    updateSubscription() {
        this.subscription = this.subscriptionManager.updateSubscription();
        this.articleManager.setSubscription(this.subscription);
    }

    updateMenu() {
        this.updateSettings();
        getFilteringTypes().forEach((type) => {
            this.updateFilteringList(type);
        });
    }

    updateSettings() {
        $id(this.enableFilteringCheckId).prop('checked', this.subscription.isFilteringEnabled());
        $id(this.enableRestrictingCheckId).prop('checked', this.subscription.isRestrictingEnabled());
        $id(this.sortingEnabledId).prop('checked', this.subscription.isSortingEnabled());
        $id(this.sortingTypeId).val(this.subscription.getSortingType());
    }

    updateFilteringList(type: FilteringType) {
        var keywordListHtml = this.getFilteringListHTML(type);
        var wasVisible = this.isVisible($id(this.getFilteringTypeTabId(type)));
        $id(this.getFilteringTypeTabId(type)).replaceWith(keywordListHtml);
        if (wasVisible) {
            $id(this.getFilteringTypeTabId(type)).show();
        }

        this.refreshFilteringAndSorting();
        this.setUpFilteringListEvents();
    }
    
    addArticle(articleNode: Node) {
        this.loadMoreArticles();
        this.articleManager.addArticle(articleNode);
    }

    loadMoreArticles() {
        if(this.subscriptionManager.getCurrentUnreadCount() == 0) {
            return;
        }
        if(this.isVisible($(cst.fullyLoadedArticlesSelector))) {
            window.scrollTo(0, 0);
            return;
        }
        var currentScrollHeight = document.body.scrollHeight;
        window.scrollTo(0, currentScrollHeight);
    }
    
    refreshFilteringAndSorting() {
        this.articleManager.resetArticles();
        $(cst.articleSelector).toArray().forEach(this.articleManager.addArticle, this.articleManager);
    }

    importKeywords() {
        var selectedURL: string = $id("FFnS_ImportMenu_SubscriptionSelect").val();
        if (selectedURL && confirm("Import keywords from the subscription url /" + selectedURL + " ?")) {
            this.subscriptionManager.importKeywords(selectedURL);
            this.updateMenu();
        }
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
        return this.getHTMLId("settingsBtn_" + elementId);
    }

    getFilteringTypeTabId(filteringType: FilteringType) {
        return this.getHTMLId("tab_" + FilteringType[filteringType]);
    }

    getIds(type: FilteringType) {
        var id = getFilteringTypeId(type);
        return {
            typeId: "Keywords_" + id,
            plusBtnId: "Add_" + id,
            eraseBtnId: "DeleteAll_" + id
        };
    }

    isVisible(e: JQuery) {
        var displayProp = e.css('display');
        return displayProp != null && displayProp != 'none';
    }

}
