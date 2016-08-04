/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType, HTMLElementType, getFilteringTypes, getFilteringTypeId} from "./DataTypes";
import {Subscription} from "./Subscription";
import {AdvancedControlsReceivedPeriod} from "./SubscriptionDTO";
import {ArticleManager} from "./ArticleManager";
import {SubscriptionManager} from "./SubscriptionManager";
import {GlobalSettingsCheckBox} from "./HTMLGlobalSettings";
import {HTMLSubscriptionManager} from "./HTMLSubscription";
import {$id, bindMarkup} from "./Utils";

export class UIManager {
    subscriptionManager: SubscriptionManager;
    htmlSubscriptionManager: HTMLSubscriptionManager;
    articleManager: ArticleManager;
    subscription: Subscription;
    autoLoadAllArticlesCB: GlobalSettingsCheckBox;
    globalSettingsEnabledCB: GlobalSettingsCheckBox;
    containsReadArticles = false;

    keywordToId = {};
    idCount = 1;

    htmlSettingsElements = [
        {type: HTMLElementType.SelectBox, ids: ["SortingType"]},
        {type: HTMLElementType.CheckBox, ids: ["FilteringEnabled", "RestrictingEnabled", "SortingEnabled"]}
    ];

    settingsDivContainerId = this.getHTMLId("settingsDivContainer");
    closeBtnId = this.getHTMLId("CloseSettingsBtn");
    advancedPeriodHoursId = this.getHTMLId("AdvancedPeriod_hours");
    advancedPeriodDaysId = this.getHTMLId("AdvancedPeriod_days");
    keepUnreadId = this.getHTMLId("AdvancedPeriod_keepUnread");
    advancedPeriodHideId = this.getHTMLId("AdvancedPeriod_hide");
    showIfHotId = this.getHTMLId("AdvancedPeriod_showIfHot");
    minPopularityId = this.getHTMLId("AdvancedPeriod_minPopularity");
    
    init() {
        this.subscriptionManager = new SubscriptionManager();
        this.articleManager = new ArticleManager(this.subscriptionManager);
        this.autoLoadAllArticlesCB = new GlobalSettingsCheckBox("autoLoadAllArticles", this, false);
        this.globalSettingsEnabledCB = new GlobalSettingsCheckBox("globalSettingsEnabled", this);
        this.initUI();

        this.htmlSubscriptionManager = new HTMLSubscriptionManager(this);
        this.htmlSettingsElements.forEach(element => {
            this.htmlSubscriptionManager.registerSettings(element.ids, element.type);
        });

        this.updatePage();
        this.initSettingsCallbacks();

        //var evalFunc = window["eval"];
        //evalFunc("(" + this.articleManager.overrideMarkAsRead.toString() + ")();");
        //evalFunc("window.ext = (" + JSON.stringify(ext).replace(/\s+/g, ' ') + ");");
    }

    updatePage() {
        this.resetPage();
        this.updateSubscription();
        this.updateMenu();
    }

    resetPage() {
        this.containsReadArticles = false;
        this.articleManager.resetArticles();
    }

    refreshPage() {
        this.updatePage();
        this.refreshFilteringAndSorting();
    }

    refreshFilteringAndSorting() {
        this.articleManager.refreshArticles();
    }

    updateSubscription() {
        var globalSettingsEnabled = this.globalSettingsEnabledCB.isEnabled();
        this.subscription = this.subscriptionManager.loadSubscription(globalSettingsEnabled);
        this.updateSubscriptionTitle(globalSettingsEnabled);
    }

    updateMenu() {
        this.updateSubscriptionSettings();
        getFilteringTypes().forEach((type) => {
            this.updateFilteringList(type);
        });
        this.updateImportOptionsHTML();
    }

    updateSubscriptionSettings() {
        this.htmlSubscriptionManager.update();
        this.updateAdvancedControlsReceivedPeriodSettings();
    }

    updateSubscriptionTitle(globalSettingsEnabled: boolean) {
        var title = globalSettingsEnabled ? "Global" : "Subscription";
        title += " settings: ";
        $id("FFnS_subscription_title").text(title);
    }

    updateImportOptionsHTML() {
        $id("FFnS_ImportMenu_SubscriptionSelect").html(this.getImportOptionsHTML());
    }

    initUI() {
        this.initSettingsMenu();
        this.initShowSettingsBtns();
        this.autoLoadAllArticlesCB.initUI();
        this.globalSettingsEnabledCB.initUI();
    }

    initSettingsMenu() {
        var marginElementClass = this.getHTMLId("margin_element");
        var tabsMenuId = this.getHTMLId("tabs_menu");
        var tabsContentContainerId = this.getHTMLId("tabs_content");

        var settingsHtml = bindMarkup(templates.settingsHTML, [
            { name: "closeIconLink", value: ext.closeIconLink },
            { name: "SortingType.PopularityDesc", value: SortingType.PopularityDesc },
            { name: "SortingType.TitleAsc", value: SortingType.TitleAsc },
            { name: "SortingType.PopularityAsc", value: SortingType.PopularityAsc },
            { name: "SortingType.TitleDesc", value: SortingType.TitleDesc },
            { name: "FilteringList.Type.FilteredOut", value: this.getFilteringListHTML(FilteringType.FilteredOut) },
            { name: "FilteringList.Type.RestrictedOn", value: this.getFilteringListHTML(FilteringType.RestrictedOn) },
            { name: "ImportMenu.SubscriptionOptions", value: this.getImportOptionsHTML() }
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
    }

    getFilteringListHTML(type: FilteringType): string {
        var ids = this.getIds(type);
        var filteringListHTML = bindMarkup(templates.filteringListHTML, [
            { name: "FilteringTypeTabId", value: this.getFilteringTypeTabId(type) },
            { name: "inputId", value: this.getHTMLId(ids.inputId) },
            { name: "plusBtnId", value: this.getHTMLId(ids.plusBtnId) },
            { name: "plusIconLink", value: ext.plusIconLink },
            { name: "eraseBtnId", value: this.getHTMLId(ids.eraseBtnId) },
            { name: "eraseIconLink", value: ext.eraseIconLink },
            { name: "filetringKeywordsId", value: ids.filetringKeywordsId }
        ]);
        return filteringListHTML;
    }

    getImportOptionsHTML(): string {
        var optionsHTML = "";
        var urls = this.subscriptionManager.getAllSubscriptionURLs();
        urls.forEach((url) => {
            optionsHTML += bindMarkup(templates.optionHTML, [{ name: "value", value: url }]);
        })
        return optionsHTML;
    }

    initShowSettingsBtns() {
        var this_ = this;
        $(ext.settingsBtnPredecessorSelector).each(function (i, element) {
            var clone = $(element).clone();
            $(clone).attr('id', this_.getBtnId(element.id));
            $(clone).attr('src', ext.filterIconLink);
            $(clone).attr('alt', 'icon');
            $(clone).attr('data-page-action', '');
            $(element).after(clone);

            $(clone).click(function () {
                $id(this_.settingsDivContainerId).toggle();
            });
        });
    }

    initSettingsCallbacks() {
        var this_ = this;

        this.htmlSubscriptionManager.init();
        
        function updateAdvancedControlsReceivedPeriodCallback() {
            this_.updateAdvancedControlsReceivedPeriod();
        }
        $id(this.keepUnreadId).change(updateAdvancedControlsReceivedPeriodCallback);
        $id(this.advancedPeriodHideId).change(updateAdvancedControlsReceivedPeriodCallback);
        $id(this.showIfHotId).change(updateAdvancedControlsReceivedPeriodCallback);
        $id(this.minPopularityId).change(updateAdvancedControlsReceivedPeriodCallback);

        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
        })

        $id("FFnS_ImportMenu_Submit").click(() => {
            this.importKeywords();
        });

        this.setUpFilteringListEvents();
    }

    updateAdvancedControlsReceivedPeriod() {
        var advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
        advancedControlsReceivedPeriod.keepUnread = this.isChecked($id(this.keepUnreadId));
        advancedControlsReceivedPeriod.hide = this.isChecked($id(this.advancedPeriodHideId));
        advancedControlsReceivedPeriod.showIfHot = this.isChecked($id(this.showIfHotId));
        advancedControlsReceivedPeriod.minPopularity = Number($id(this.minPopularityId).val());
        var advancedPeriodHours = Number($id(this.advancedPeriodHoursId).val());
        var advancedPeriodDays = Number($id(this.advancedPeriodDaysId).val());
        advancedControlsReceivedPeriod.maxHours = advancedPeriodHours + 24 * advancedPeriodDays;
        this.subscription.setAdvancedControlsReceivedPeriod(advancedControlsReceivedPeriod);
    }

    updateAdvancedControlsReceivedPeriodSettings() {
        var advancedControlsReceivedPeriod = this.subscription.getAdvancedControlsReceivedPeriod();
        if (advancedControlsReceivedPeriod == null) {
            advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
        }
        var maxHours = advancedControlsReceivedPeriod.maxHours;
        this.setChecked(this.keepUnreadId, advancedControlsReceivedPeriod.keepUnread);
        this.setChecked(this.advancedPeriodHideId, advancedControlsReceivedPeriod.hide);
        this.setChecked(this.showIfHotId, advancedControlsReceivedPeriod.showIfHot);
        $id(this.minPopularityId).val(advancedControlsReceivedPeriod.minPopularity);
        var advancedPeriodHours = Math.floor(advancedControlsReceivedPeriod.maxHours / 24);
        var advancedPeriodDays = maxHours % 24;
        $id(this.advancedPeriodHoursId).val(advancedPeriodHours);
        $id(this.advancedPeriodDaysId).val(advancedPeriodDays);

        $id(this.minPopularityId)[0].oninput = this.updateAdvancedControlsReceivedPeriod;
        $id(this.advancedPeriodHoursId)[0].oninput = this.updateAdvancedControlsReceivedPeriod;
        $id(this.advancedPeriodDaysId)[0].oninput = this.updateAdvancedControlsReceivedPeriod;
    }

    private setUpFilteringListEvents() {
        getFilteringTypes().forEach(this.setUpFilteringListManagementEvents, this);
    }

    private setUpFilteringListManagementEvents(type: FilteringType) {
        var ids = this.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);

        // Add button
        $id(this.getHTMLId(ids.plusBtnId)).click(() => {
            var input = $id(this.getHTMLId(ids.inputId));
            var keyword = input.val();
            if (keyword != null && keyword !== "") {
                this.subscription.addKeyword(keyword, type);
                this.updateFilteringList(type);
                input.val("");
            }
        });

        // Erase all button
        $id(this.getHTMLId(ids.eraseBtnId)).click(() => {
            if (confirm("Erase all the keywords of this list ?")) {
                this.subscription.resetFilteringList(type);
                this.updateFilteringList(type);
            }
        });

        this.setUpKeywordButtonsEvents(type);
    }

    private setUpKeywordButtonsEvents(type: FilteringType) {
        var ids = this.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);

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

    updateFilteringList(type: FilteringType) {
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

        $id(ids.filetringKeywordsId).html(filteringKeywordsHTML);
        this.refreshFilteringAndSorting();
        this.setUpKeywordButtonsEvents(type);
    }

    addArticle(articleNode: Node) {
        this.checkReadArticles(articleNode);
        if (this.containsReadArticles) {
            return;
        }
        this.tryAutoLoadAllArticles();
        this.articleManager.addArticle(articleNode);
    }

    checkReadArticles(articleNode: Node) {
        if (!this.containsReadArticles) {
            this.containsReadArticles = $(articleNode).find(ext.articleLinkSelector).hasClass(ext.readArticleClass);
            if (this.containsReadArticles) {
                this.articleManager.resetArticles();
                window.scrollTo(0, 0);
            }
        }
    }

    tryAutoLoadAllArticles() {
        if (!this.autoLoadAllArticlesCB.isEnabled()) {
            return;
        }
        if (this.isVisible($(ext.fullyLoadedArticlesSelector))) {
            this.subscriptionManager.updateUnreadCount();
            window.scrollTo(0, 0);
            return;
        }
        var currentScrollHeight = document.body.scrollHeight;
        window.scrollTo(0, currentScrollHeight);
    }

    importKeywords() {
        var selectedURL: string = $id("FFnS_ImportMenu_SubscriptionSelect").val();
        if (selectedURL && confirm("Import keywords from the subscription url /" + selectedURL + " ?")) {
            this.subscriptionManager.importKeywords(selectedURL);
            this.updateMenu();
        }
    }

    public isChecked(input: JQuery): boolean {
        return input.is(':checked');
    }

    public setChecked(htmlId: string, checked: boolean) {
        $id(htmlId).prop('checked', checked);
    }

    public getHTMLId(id: string) {
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
            inputId: "Input_" + id,
            plusBtnId: "Add_" + id,
            eraseBtnId: "DeleteAll_" + id,
            filetringKeywordsId: "FiletringKeywords_" + id
        };
    }

    isVisible(e: JQuery) {
        var displayProp = e.css('display');
        return displayProp != null && displayProp != 'none';
    }

}
