/// <reference path="./_references.d.ts" />

import {FilteringType, SortingType, HTMLElementType, getFilteringTypes, getFilteringTypeId} from "./DataTypes";
import {Subscription} from "./Subscription";
import {AdvancedControlsReceivedPeriod} from "./SubscriptionDTO";
import {ArticleManager} from "./ArticleManager";
import {SubscriptionManager} from "./SubscriptionManager";
import {GlobalSettingsCheckBox} from "./HTMLGlobalSettings";
import {HTMLSubscriptionManager, HTMLSubscriptionSetting} from "./HTMLSubscription";
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
        {
            type: HTMLElementType.SelectBox, ids: ["SortingType"]
        },
        {
            type: HTMLElementType.CheckBox,
            ids: ["FilteringEnabled", "RestrictingEnabled", "SortingEnabled", "PinHotToTop",
                "KeepUnread_AdvancedControlsReceivedPeriod", "Hide_AdvancedControlsReceivedPeriod",
                "ShowIfHot_AdvancedControlsReceivedPeriod", "MarkAsReadVisible_AdvancedControlsReceivedPeriod"]
        },
        {
            type: HTMLElementType.NumberInput, ids: ["MinPopularity_AdvancedControlsReceivedPeriod"]
        }
    ];

    settingsDivContainerId = this.getHTMLId("settingsDivContainer");
    closeBtnId = this.getHTMLId("CloseSettingsBtn");

    init() {
        try {
            this.subscriptionManager = new SubscriptionManager();
            this.articleManager = new ArticleManager(this.subscriptionManager);
            this.htmlSubscriptionManager = new HTMLSubscriptionManager(this);
            this.autoLoadAllArticlesCB = new GlobalSettingsCheckBox("autoLoadAllArticles", this, false);
            this.globalSettingsEnabledCB = new GlobalSettingsCheckBox("globalSettingsEnabled", this);
            this.initUI();
            this.registerSettings();
            this.updatePage();
            this.initSettingsCallbacks();
        } catch (err) {
            console.log(err);
        }
    }

    updatePage() {
        try {
            this.resetPage();
            this.updateSubscription();
            this.updateMenu();
        } catch (err) {
            console.log(err);
        }
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
        this.updateSettingsControls();
    }

    updateSubscriptionSettings() {
        this.htmlSubscriptionManager.update();
    }

    updateSubscriptionTitle(globalSettingsEnabled: boolean) {
        var title = globalSettingsEnabled ? "Global" : "Subscription";
        title += " settings";
        $id("FFnS_subscription_title").text(title);
    }

    updateSettingsControls() {
        $id("FFnS_SettingsControls_SelectedSubscription").html(this.getImportOptionsHTML());
        var linkedSubContainer = $id("FFnS_SettingsControls_LinkedSubContainer");
        var linkedSub = $id("FFnS_SettingsControls_LinkedSub");
        if (( (!this.globalSettingsEnabledCB.isEnabled()) && this.subscription.getURL() !== this.subscriptionManager.getActualSubscriptionURL() ) ||
            (this.globalSettingsEnabledCB.isEnabled() && !this.subscriptionManager.isGlobalMode())) {
            linkedSubContainer.css("display", "");
            linkedSub.text("Subscription currently linked to: " + this.subscription.getURL());
        } else {
            linkedSubContainer.css("display", "none");
            linkedSub.text("");
        }
    }

    getSettingsControlsSelectedSubscription(): string {
        return $id("FFnS_SettingsControls_SelectedSubscription").val();
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
            { name: "SortingType.PublishDateNewFirst", value: SortingType.PublishDateNewFirst },
            { name: "SortingType.PublishDateOldFirst", value: SortingType.PublishDateOldFirst },
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
        NodeCreationObserver.onCreation(ext.settingsBtnPredecessorSelector, (element) => {
            var clone = $(element).clone();
            $(clone).attr('id', this_.getBtnId(element.id));
            $(clone).removeAttr('title');
            $(clone).attr('src', ext.filterIconLink);
            $(clone).attr('alt', 'icon');
            $(clone).attr('data-page-action', '');
            $(element).after(clone);

            $(clone).click(function () {
                $id(this_.settingsDivContainerId).toggle();
            });
        });
    }

    registerSettings() {
        this.htmlSettingsElements.forEach(element => {
            this.htmlSubscriptionManager.registerSettings(element.ids, element.type);
        });
        this.htmlSubscriptionManager.registerSettings(
            ["Hours_AdvancedControlsReceivedPeriod", "Days_AdvancedControlsReceivedPeriod"],
            HTMLElementType.NumberInput, {
                update: (subscriptionSetting: HTMLSubscriptionSetting) => {
                    var advancedControlsReceivedPeriod = subscriptionSetting.manager.subscription.getAdvancedControlsReceivedPeriod();
                    var maxHours = advancedControlsReceivedPeriod.maxHours;
                    var advancedPeriodHours = maxHours % 24;
                    var advancedPeriodDays = Math.floor(maxHours / 24);
                    if (subscriptionSetting.id.indexOf("Hours") != -1) {
                        $id(subscriptionSetting.htmlId).val(advancedPeriodHours);
                    } else {
                        $id(subscriptionSetting.htmlId).val(advancedPeriodDays);
                    }
                }
            }
        );
    }

    initSettingsCallbacks() {
        var this_ = this;

        this.htmlSubscriptionManager.setUpCallbacks();

        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
        })

        $id("FFnS_SettingsControls_ImportFromOtherSub").click(() => {
            this.importFromOtherSub();
        });

        $id("FFnS_SettingsControls_LinkToSub").click(() => {
            this.linkToSub();
        });

        $id("FFnS_SettingsControls_UnlinkFromSub").click(() => {
            this.unlinkFromSub();
        });

        $id("FFnS_SettingsControls_DeleteSub").click(() => {
            this.deleteSub();
        });

        this.setUpFilteringListEvents();
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

    addArticle(article: Element) {
        try {
            this.checkReadArticles(article);
            if (this.containsReadArticles) {
                return;
            }
            this.articleManager.addArticle(article);
            this.tryAutoLoadAllArticles();
        } catch (err) {
            console.log(err);
        }
    }

    addMagazineTopEntry(article: Element) {
        try {
            this.articleManager.addMagazineTopEntry(article);
        } catch (err) {
            console.log(err);
        }
    }

    addSection(section: Element) {
        if (section.id === "section0") {
            $(section).find("h2").text(" ");
        } else {
            $(section).remove();
        }
    }

    checkReadArticles(article: Element) {
        if (!this.containsReadArticles) {
            this.containsReadArticles = $(article).find(ext.articleLinkSelector).hasClass(ext.readArticleClass);
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
            window.scrollTo(0, 0);
            return;
        }
        var currentScrollHeight = document.body.scrollHeight;
        window.scrollTo(0, currentScrollHeight);
    }

    importFromOtherSub() {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Import keywords from the subscription url /" + selectedURL + " ?")) {
            this.subscriptionManager.importKeywords(selectedURL);
            this.refreshPage();
        }
    }

    linkToSub() {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Link current subscription to: /" + selectedURL + " ?")) {
            this.subscriptionManager.linkToSubscription(selectedURL);
            this.refreshPage();
        }
    }

    unlinkFromSub() {
        if (confirm("Unlink current subscription ?")) {
            this.subscriptionManager.deleteSubscription(this.subscriptionManager.getActualSubscriptionURL());
            this.refreshPage();
        }
    }

    deleteSub() {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Delete : /" + selectedURL + " ?")) {
            this.subscriptionManager.deleteSubscription(selectedURL);
            this.refreshPage();
        }
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
        return this.getHTMLId("Tab_" + FilteringType[filteringType]);
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
