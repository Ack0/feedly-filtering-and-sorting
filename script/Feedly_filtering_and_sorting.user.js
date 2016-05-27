// ==UserScript==
// @name        Feedly filtering and sorting
// @namespace   https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @description Enhance the feedly website with advanced filtering and sorting capabilities
// @author      Soufiane Sakhi
// @license     MIT licensed, Copyright (c) 2016 Soufiane Sakhi (https://opensource.org/licenses/MIT)
// @homepage    https://github.com/soufianesakhi/feedly-filtering-and-sorting
// @supportURL  https://github.com/soufianesakhi/feedly-filtering-and-sorting/issues
// @icon        http://s3.feedly.com/img/feedly-512.png
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.githubusercontent.com/soufianesakhi/node-creation-observer-js/master/release/node-creation-observer-latest.js
// @include     *://feedly.com/*
// @version     1.0.0
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_listValues
// ==/UserScript==

var ext = {
    "filterIconLink": "https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/128/empty_filter.png",
    "plusIconLink": "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
    "eraseIconLink": "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
    "closeIconLink": "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
    "urlPrefixPattern": "https?:\/\/[^\/]+\/i\/",
    "settingsBtnPredecessorSelector": "#pageActionCustomize, #floatingPageActionCustomize",
    "articleSelector": "#section0_column0 > div",
    "pageChangeSelector": "h1#feedlyTitleBar > .hhint",
    "articleTitleAttribute": "data-title",
    "popularitySelector": ".nbrRecommendations",
    "unreadCountSelector": "#feedlyTitleBar [class*='UnreadCount']",
    "fullyLoadedArticlesSelector": "#fullyLoadedFollowing"
};

var exported = {};
function $id(id) {
    return $('#' + id);
}
function bindMarkup(html, bindings) {
    bindings.forEach(function (binding) {
        html = html.replace(new RegExp("\{\{" + binding.name + "\}\}", "g"), "" + binding.value);
    });
    return html;
}
function callbackBindedTo(thisArg) {
    return (function (callback) {
        return callback.bind(this);
    }).bind(thisArg);
}

(function (SortingType) {
    SortingType[SortingType["PopularityDesc"] = 0] = "PopularityDesc";
    SortingType[SortingType["PopularityAsc"] = 1] = "PopularityAsc";
    SortingType[SortingType["TitleDesc"] = 2] = "TitleDesc";
    SortingType[SortingType["TitleAsc"] = 3] = "TitleAsc";
})(exported.SortingType || (exported.SortingType = {}));
var SortingType = exported.SortingType;
(function (FilteringType) {
    FilteringType[FilteringType["RestrictedOn"] = 0] = "RestrictedOn";
    FilteringType[FilteringType["FilteredOut"] = 1] = "FilteredOut";
})(exported.FilteringType || (exported.FilteringType = {}));
var FilteringType = exported.FilteringType;
function getFilteringTypes() {
    return [FilteringType.FilteredOut, FilteringType.RestrictedOn];
}
function getFilteringTypeId(type) {
    return FilteringType[type];
}

var LocalPersistence = (function () {
    function LocalPersistence() {
    }
    LocalPersistence.get = function (id, defaultValue) {
        return JSON.parse(GM_getValue(id, JSON.stringify(defaultValue)));
    };
    LocalPersistence.put = function (id, value, replace) {
        GM_setValue(id, JSON.stringify(value, replace));
    };
    return LocalPersistence;
}());

var Subscription = (function () {
    function Subscription(subscriptionDAO, url) {
        var _this = this;
        this.filteringEnabled = false;
        this.restrictingEnabled = false;
        this.sortingEnabled = true;
        this.sortingType = SortingType.PopularityDesc;
        this.filteringListsByType = {};
        this.dao = subscriptionDAO;
        this.url = url;
        getFilteringTypes().forEach(function (type) {
            _this.filteringListsByType[type] = [];
        });
    }
    Subscription.prototype.update = function (subscription, skipSave) {
        this.filteringEnabled = subscription.filteringEnabled;
        this.restrictingEnabled = subscription.restrictingEnabled;
        this.sortingEnabled = subscription.sortingEnabled;
        this.sortingType = subscription.sortingType;
        this.filteringListsByType = subscription.filteringListsByType;
        if (!skipSave) {
            this.dao.save(this);
        }
    };
    Subscription.prototype.getURL = function () {
        return this.url;
    };
    Subscription.prototype.isFilteringEnabled = function () {
        return this.filteringEnabled;
    };
    Subscription.prototype.setFilteringEnabled = function (filteringEnabled) {
        this.filteringEnabled = filteringEnabled;
        this.dao.save(this);
    };
    Subscription.prototype.isRestrictingEnabled = function () {
        return this.restrictingEnabled;
    };
    Subscription.prototype.setRestrictingEnabled = function (restrictingEnabled) {
        this.restrictingEnabled = restrictingEnabled;
        this.dao.save(this);
    };
    Subscription.prototype.isSortingEnabled = function () {
        return this.sortingEnabled;
    };
    Subscription.prototype.setSortingEnabled = function (sortingEnabled) {
        this.sortingEnabled = sortingEnabled;
        this.dao.save(this);
    };
    Subscription.prototype.getSortingType = function () {
        return this.sortingType;
    };
    Subscription.prototype.setSortingType = function (sortingType) {
        this.sortingType = sortingType;
        this.dao.save(this);
    };
    Subscription.prototype.getFilteringList = function (type) {
        return this.filteringListsByType[type];
    };
    Subscription.prototype.addKeyword = function (keyword, type) {
        this.getFilteringList(type).push(keyword);
        this.dao.save(this);
    };
    Subscription.prototype.removeKeyword = function (keyword, type) {
        var keywordList = this.getFilteringList(type);
        var index = keywordList.indexOf(keyword);
        if (index > -1) {
            keywordList.splice(index, 1);
        }
        this.dao.save(this);
    };
    Subscription.prototype.reset = function (type) {
        this.getFilteringList(type).length = 0;
        this.dao.save(this);
    };
    return Subscription;
}());

var SubscriptionDAO = (function () {
    function SubscriptionDAO() {
        this.SUBSCRIPTION_ID_PREFIX = "subscription_";
    }
    SubscriptionDAO.prototype.save = function (subscription) {
        var url = subscription.getURL();
        var id = this.getSubscriptionId(url);
        this.put(id, subscription);
        console.log("Subscription saved: " + JSON.stringify(subscription));
    };
    SubscriptionDAO.prototype.load = function (url) {
        var subscription = new Subscription(this, url);
        var subscriptionDTO = LocalPersistence.get(this.getSubscriptionId(url), null);
        if (subscriptionDTO != null) {
            console.log("Loaded saved subscription: " + JSON.stringify(subscriptionDTO));
            subscription.update(subscriptionDTO, true);
        }
        return subscription;
    };
    SubscriptionDAO.prototype.getAllSubscriptionURLs = function () {
        var _this = this;
        var urls = GM_listValues().filter(function (value) {
            return value.indexOf(_this.SUBSCRIPTION_ID_PREFIX) == 0;
        });
        urls = urls.map(function (value) {
            return value.substring(_this.SUBSCRIPTION_ID_PREFIX.length);
        });
        return urls;
    };
    SubscriptionDAO.prototype.getSubscriptionId = function (url) {
        return this.SUBSCRIPTION_ID_PREFIX + url;
    };
    SubscriptionDAO.prototype.put = function (id, value) {
        LocalPersistence.put(id, value, function (key, val) {
            if (!(val instanceof SubscriptionDAO))
                return val;
        });
    };
    return SubscriptionDAO;
}());

var SubscriptionManager = (function () {
    function SubscriptionManager() {
        this.dao = new SubscriptionDAO();
        this.urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
        this.currentUnreadCount = 0;
    }
    SubscriptionManager.prototype.updateSubscription = function () {
        this.updateUnreadCount();
        var url = this.getSubscriptionURL();
        return this.currentSubscription = this.dao.load(url);
    };
    SubscriptionManager.prototype.importKeywords = function (url) {
        var importedSubscription = this.dao.load(url);
        this.currentSubscription.update(importedSubscription);
    };
    SubscriptionManager.prototype.getAllSubscriptionURLs = function () {
        return this.dao.getAllSubscriptionURLs();
    };
    SubscriptionManager.prototype.getSubscriptionURL = function () {
        var url = document.URL;
        url = url.replace(this.urlPrefixPattern, "");
        return url;
    };
    SubscriptionManager.prototype.updateUnreadCount = function () {
        var unreadCountHint = $(ext.unreadCountSelector).text().trim();
        var unreadCountStr = unreadCountHint.split(" ")[0];
        var unreadCount = Number(unreadCountStr);
        this.currentUnreadCount = isNaN(unreadCount) ? 0 : unreadCount;
    };
    SubscriptionManager.prototype.getCurrentUnreadCount = function () {
        return this.currentUnreadCount;
    };
    return SubscriptionManager;
}());

var ArticleManager = (function () {
    function ArticleManager() {
        this.titles = [];
        this.popularityArray = [];
    }
    ArticleManager.prototype.setSubscription = function (subscription) {
        this.subscription = subscription;
    };
    ArticleManager.prototype.resetArticles = function () {
        this.titles = [];
        this.popularityArray = [];
    };
    ArticleManager.prototype.addArticle = function (articleNode) {
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
            }
            else {
                article.css("display", "");
            }
        }
        else {
            article.css("display", "");
        }
        if (this.subscription.isSortingEnabled()) {
            this.sortArticle(article);
        }
    };
    ArticleManager.prototype.sortArticle = function (article) {
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
    };
    ArticleManager.prototype.insertIndex = function (element, i) {
        // The elemen0t we want to swap with
        var $target = element.parent().children().eq(i);
        // Determine the direction of the appended index so we know what side to place it on
        if (element.index() > i) {
            $target.before(element);
        }
        else {
            $target.after(element);
        }
    };
    return ArticleManager;
}());

var templates = {
    "settingsHTML": "<div id='FFnS_settingsDivContainer'> <div id='FFnS_settingsDiv'> <img id='FFnS_CloseSettingsBtn' src='{{closeIconLink}}' class='pageAction requiresLogin'> <div class='FFnS_settings'> <span class='FFnS_settings_header'>General settings: </span> <span class='FFnS_settings_span tooltip'> Auto load all unread articles <span class='tooltiptext'>Not applied if there are no unread articles</span> </span> <input id='FFnS_autoLoadAllArticles' type='checkbox'> <span class='FFnS_settings_span tooltip'> Use global settings <span class='tooltiptext'>Use the global settings (filtering, sorting) for all subscriptions and categories. Uncheck to have specific settings for each subscription/category</span> </span> <input id='FFnS_globalSettingsEnabled' type='checkbox'> </div> <div class='FFnS_settings'> <span class='FFnS_settings_header'>Subscription settings: </span> <span> <span class='FFnS_settings_span tooltip'> Filtering enabled <span class='tooltiptext'>Hide the articles that contain at least one of the filtering keywords (not applied if empty)</span> </span> <input id='FFnS_enableFiltering' type='checkbox'> </span> <span> <span class='FFnS_settings_span tooltip'> Restricting enabled <span class='tooltiptext'>Show only articles that contain at least one of the restricting keywords (not applied if empty)</span> </span> <input id='FFnS_enableRestricting' type='checkbox'> </span> <span> <span class='FFnS_settings_span'>Sorting enabled</span> <input id='FFnS_sortingEnabled' type='checkbox'> <select id='FFnS_sortingType'> <option value='{{SortingType.PopularityDesc}}'>Sort by popularity (highest to lowest)</option> <option value='{{SortingType.TitleAsc}}'>Sort by title (a -&gt; z)</option> <option value='{{SortingType.PopularityAsc}}'>Sort by popularity (lowest to highest)</option> <option value='{{SortingType.TitleDesc}}'>Sort by title (z -&gt; a)</option> </select> </span> <ul id='FFnS_tabs_menu'> <li class='current'> <a href='#FFnS_tab_FilteredOut'>Filtering keywords</a> </li> <li class=''> <a href='#FFnS_tab_RestrictedOn'>Restricting keywords</a> </li> <li class=''> <a href='#FFnS_tab_ImportMenu'>Import subscription settings</a> </li> </ul> <div id='FFnS_tabs_content'> {{FilteringList.Type.FilteredOut}} {{FilteringList.Type.RestrictedOn}} <div id='FFnS_tab_ImportMenu' class='FFnS_Tab_Menu'> <span class='FFnS_settings_span'>Import subscription settings from url: </span> <select id='FFnS_ImportMenu_SubscriptionSelect'> {{ImportMenu.SubscriptionOptions}} </select> <div><button id='FFnS_ImportMenu_Submit'>Import</button></div> </div> </div> </div> </div> </div>",
    "filteringListHTML": "<div id='{{FilteringTypeTabId}}' class='FFnS_Tab_Menu'> <span id='{{plusBtnId}}'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='{{eraseBtnId}}'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> {{filetring.keywords}} </div> ",
    "filteringKeywordHTML": "<button id='{{keywordId}}' type='button' class='FFnS_keyword'>{{keyword}}</button>",
    "optionHTML": "<option value='{{value}}'>{{value}}</option>",
    "styleCSS": "#FFnS_settingsDivContainer { display: none; background: rgba(0,0,0,0.9); width: 100%; height: 100%; z-index: 500; top: 0; left: 0; position: fixed; } #FFnS_settingsDiv { max-height: 400px; margin-top: 1%; margin-left: 15%; margin-right: 1%; border-radius: 25px; border: 2px solid #336699; background: #E0F5FF; padding: 2%; opacity: 1; } .FFnS_settings + .FFnS_settings { margin-top: 1%; } .FFnS_settings > :not(input):not(:first-child) { margin-left: 2%; } .FFnS_settings_header { color: #333690; } .FFnS_settings span + input { vertical-align: middle; } .FFnS_settings select { margin-left: 2% } FFnS_sortingType { font-size:12px; vertical-align: middle; } #FFnS_tabs_menu { height: 30px; clear: both; margin-top: 1%; margin-bottom: 0%; padding: 0px; } #FFnS_tabs_menu li { height: 30px; line-height: 30px; display: inline-block; border: 1px solid #d4d4d1; } #FFnS_tabs_menu li.current { background-color: #B9E0ED; } #FFnS_tabs_menu li a { padding: 10px; color: #2A687D; } #FFnS_tabs_content { padding: 1%; } .FFnS_Tab_Menu { display: none; width: 100%; max-height: 340px; overflow-y: auto; overflow-x: hidden; } .FFnS_settings_span { display: inline; vertical-align: middle; } .FFnS_icon { vertical-align: middle; height: 20px; width: 20px; cursor: pointer; } .FFnS_keyword { vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer; } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { visibility: hidden; width: 120px; background-color: black; color: #fff; text-align: center; padding: 5px; border-radius: 6px; position: absolute; z-index: 1; } .tooltip:hover .tooltiptext { visibility: visible; } #FFnS_CloseSettingsBtn { float:right; width: 24px; height: 24px; } #FFnS_ImportMenu_Submit { margin-top: 1%; }"
};

var UIManager = (function () {
    function UIManager() {
        this.subscriptionManager = new SubscriptionManager();
        this.articleManager = new ArticleManager();
        this.keywordToId = {};
        this.idCount = 1;
        this.settingsDivContainerId = this.getHTMLId("settingsDivContainer");
        this.closeBtnId = this.getHTMLId("CloseSettingsBtn");
        this.enableFilteringCheckId = this.getHTMLId("enableFiltering");
        this.enableRestrictingCheckId = this.getHTMLId("enableRestricting");
        this.sortingTypeId = this.getHTMLId("sortingType");
        this.sortingEnabledId = this.getHTMLId("sortingEnabled");
    }
    UIManager.prototype.initPage = function () {
        this.autoLoadAllArticlesCB = new CheckBox("autoLoadAllArticles", this);
        this.globalSettingsEnabledCB = new CheckBox("globalSettingsEnabled", this);
        this.updatePage();
        this.initUI();
    };
    UIManager.prototype.updatePage = function () {
        this.resetPage();
        this.updateSubscription();
        this.updateMenu();
    };
    UIManager.prototype.initUI = function () {
        var urls = this.subscriptionManager.getAllSubscriptionURLs();
        this.initSettingsMenu();
        this.initShowSettingsBtns();
        this.initSettingsEvents();
        this.autoLoadAllArticlesCB.initUI();
        this.globalSettingsEnabledCB.initUI();
    };
    UIManager.prototype.addArticle = function (articleNode) {
        this.loadAllArticles();
        this.articleManager.addArticle(articleNode);
    };
    UIManager.prototype.updateSubscription = function () {
        this.subscription = this.subscriptionManager.updateSubscription();
        this.articleManager.setSubscription(this.subscription);
    };
    UIManager.prototype.updateMenu = function () {
        var _this = this;
        this.updateSubscriptionSettings();
        getFilteringTypes().forEach(function (type) {
            _this.updateFilteringList(type);
        });
    };
    UIManager.prototype.initSettingsMenu = function () {
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
        this.updateSubscriptionSettings();
    };
    UIManager.prototype.getFilteringListHTML = function (type) {
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
            { name: "plusIconLink", value: ext.plusIconLink },
            { name: "eraseBtnId", value: this.getHTMLId(ids.eraseBtnId) },
            { name: "eraseIconLink", value: ext.eraseIconLink },
            { name: "filetring.keywords", value: filteringKeywordsHTML }
        ]);
        return filteringListHTML;
    };
    UIManager.prototype.getImportKeywordsSubscriptionOptions = function () {
        var optionsHTML = "";
        var urls = this.subscriptionManager.getAllSubscriptionURLs();
        urls.forEach(function (url) {
            optionsHTML += bindMarkup(templates.optionHTML, [{ name: "value", value: url }]);
        });
        return optionsHTML;
    };
    UIManager.prototype.initShowSettingsBtns = function () {
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
    };
    UIManager.prototype.initSettingsEvents = function () {
        var _this = this;
        var this_ = this;
        // Checkbox & select boxes events
        $id(this.enableFilteringCheckId).change(function () {
            this_.subscription.setFilteringEnabled(this_.isChecked($(this)));
            this_.refreshFilteringAndSorting();
        });
        $id(this.enableRestrictingCheckId).change(function () {
            this_.subscription.setRestrictingEnabled(this_.isChecked($(this)));
            this_.refreshFilteringAndSorting();
        });
        $id(this.sortingEnabledId).change(function () {
            this_.subscription.setSortingEnabled(this_.isChecked($(this)));
            this_.refreshFilteringAndSorting();
        });
        var sortingTypeSelect = $id(this.sortingTypeId);
        sortingTypeSelect.change(function () {
            this_.subscription.setSortingType(sortingTypeSelect.val());
            this_.refreshFilteringAndSorting();
        });
        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
        });
        $id("FFnS_ImportMenu_Submit").click(function () {
            _this.importKeywords();
        });
        this.setUpFilteringListEvents();
    };
    UIManager.prototype.setUpFilteringListEvents = function () {
        getFilteringTypes().forEach(this.setUpFilteringListTypeEvents, this);
    };
    UIManager.prototype.setUpFilteringListTypeEvents = function (type) {
        var _this = this;
        var ids = this.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);
        $id(this.getHTMLId(ids.plusBtnId)).click(function () {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                _this.subscription.addKeyword(keyword, type);
                _this.updateFilteringList(type);
            }
        });
        // Erase button event
        $id(this.getHTMLId(ids.eraseBtnId)).click(function () {
            if (confirm("Erase all the keyword of this list ?")) {
                _this.subscription.reset(type);
                _this.updateFilteringList(type);
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
    };
    UIManager.prototype.resetPage = function () {
        this.articleManager.resetArticles();
    };
    UIManager.prototype.updateSubscriptionSettings = function () {
        this.setChecked(this.enableFilteringCheckId, this.subscription.isFilteringEnabled());
        this.setChecked(this.enableRestrictingCheckId, this.subscription.isRestrictingEnabled());
        this.setChecked(this.sortingEnabledId, this.subscription.isSortingEnabled());
        $id(this.sortingTypeId).val(this.subscription.getSortingType());
    };
    UIManager.prototype.updateFilteringList = function (type) {
        var keywordListHtml = this.getFilteringListHTML(type);
        var wasVisible = this.isVisible($id(this.getFilteringTypeTabId(type)));
        $id(this.getFilteringTypeTabId(type)).replaceWith(keywordListHtml);
        if (wasVisible) {
            $id(this.getFilteringTypeTabId(type)).show();
        }
        this.refreshFilteringAndSorting();
        this.setUpFilteringListEvents();
    };
    UIManager.prototype.loadAllArticles = function () {
        if (!this.autoLoadAllArticlesCB.isEnabled()) {
            return;
        }
        if (this.subscriptionManager.getCurrentUnreadCount() == 0) {
            return;
        }
        if (this.isVisible($(ext.fullyLoadedArticlesSelector))) {
            window.scrollTo(0, 0);
            return;
        }
        var currentScrollHeight = document.body.scrollHeight;
        window.scrollTo(0, currentScrollHeight);
    };
    UIManager.prototype.refreshFilteringAndSorting = function () {
        this.articleManager.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.articleManager.addArticle, this.articleManager);
    };
    UIManager.prototype.importKeywords = function () {
        var selectedURL = $id("FFnS_ImportMenu_SubscriptionSelect").val();
        if (selectedURL && confirm("Import keywords from the subscription url /" + selectedURL + " ?")) {
            this.subscriptionManager.importKeywords(selectedURL);
            this.updateMenu();
        }
    };
    UIManager.prototype.isChecked = function (input) {
        return input.is(':checked');
    };
    UIManager.prototype.setChecked = function (htmlId, checked) {
        $id(htmlId).prop('checked', checked);
    };
    UIManager.prototype.getHTMLId = function (id) {
        return "FFnS_" + id;
    };
    UIManager.prototype.getKeywordId = function (keywordListId, keyword) {
        if (!(keyword in this.keywordToId)) {
            var id = this.idCount++;
            this.keywordToId[keyword] = id;
        }
        return this.getHTMLId(keywordListId + "_" + this.keywordToId[keyword]);
    };
    UIManager.prototype.getBtnId = function (elementId) {
        return this.getHTMLId("settingsBtn_" + elementId);
    };
    UIManager.prototype.getFilteringTypeTabId = function (filteringType) {
        return this.getHTMLId("tab_" + FilteringType[filteringType]);
    };
    UIManager.prototype.getIds = function (type) {
        var id = getFilteringTypeId(type);
        return {
            typeId: "Keywords_" + id,
            plusBtnId: "Add_" + id,
            eraseBtnId: "DeleteAll_" + id
        };
    };
    UIManager.prototype.isVisible = function (e) {
        var displayProp = e.css('display');
        return displayProp != null && displayProp != 'none';
    };
    return UIManager;
}());

var CheckBox = (function () {
    function CheckBox(id, uiManager) {
        this.id = id;
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        this.enabled = LocalPersistence.get(this.id, true);
        this.uiManager.setChecked(this.htmlId, this.enabled);
    }
    CheckBox.prototype.isEnabled = function () {
        return this.enabled;
    };
    CheckBox.prototype.setEnabled = function (enabled) {
        LocalPersistence.put(this.id, enabled);
        this.enabled = enabled;
        this.refreshUI();
    };
    CheckBox.prototype.initUI = function () {
        var this_ = this;
        $id(this.htmlId).click(function () {
            this_.setEnabled(this_.uiManager.isChecked($(this)));
        });
        this.refreshUI();
    };
    CheckBox.prototype.refreshUI = function () {
        this.uiManager.setChecked(this.htmlId, this.enabled);
    };
    return CheckBox;
}());

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBindedTo(uiManager);
    $("head").append("<style>" + templates.styleCSS + "</style>");
    NodeCreationObserver.onCreation(ext.pageChangeSelector, function () {
        console.log("Feedly page fully loaded");
        uiManager.initPage();
        NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
        NodeCreationObserver.onCreation(ext.pageChangeSelector, uiManagerBind(uiManager.updatePage));
    }, true);
});
