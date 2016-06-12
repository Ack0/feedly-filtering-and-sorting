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
// @version     1.0.1
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
    "subscriptionChangeSelector": "h1#feedlyTitleBar > .hhint",
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

var SubscriptionDTO = (function () {
    function SubscriptionDTO(url) {
        var _this = this;
        this.filteringEnabled = false;
        this.restrictingEnabled = false;
        this.sortingEnabled = true;
        this.sortingType = SortingType.PopularityDesc;
        this.filteringListsByType = {};
        this.url = url;
        getFilteringTypes().forEach(function (type) {
            _this.filteringListsByType[type] = [];
        });
    }
    return SubscriptionDTO;
}());

var Subscription = (function () {
    function Subscription(dto, dao) {
        this.dto = dto;
        this.dao = dao;
    }
    Subscription.prototype.update = function (subscription, skipSave) {
        var newDTO = subscription.clone(this.getURL());
        this.setDTO(newDTO);
        if (!skipSave) {
            this.dao.save(this.dto);
        }
    };
    Subscription.prototype.clone = function (cloneUrl) {
        return this.dao.clone(this.dto, cloneUrl);
    };
    Subscription.prototype.setDTO = function (dto) {
        this.dto = dto;
    };
    Subscription.prototype.getURL = function () {
        return this.dto.url;
    };
    Subscription.prototype.isFilteringEnabled = function () {
        return this.dto.filteringEnabled;
    };
    Subscription.prototype.setFilteringEnabled = function (filteringEnabled) {
        this.dto.filteringEnabled = filteringEnabled;
        this.dao.save(this.dto);
    };
    Subscription.prototype.isRestrictingEnabled = function () {
        return this.dto.restrictingEnabled;
    };
    Subscription.prototype.setRestrictingEnabled = function (restrictingEnabled) {
        this.dto.restrictingEnabled = restrictingEnabled;
        this.dao.save(this.dto);
    };
    Subscription.prototype.isSortingEnabled = function () {
        return this.dto.sortingEnabled;
    };
    Subscription.prototype.setSortingEnabled = function (sortingEnabled) {
        this.dto.sortingEnabled = sortingEnabled;
        this.dao.save(this.dto);
    };
    Subscription.prototype.getSortingType = function () {
        return this.dto.sortingType;
    };
    Subscription.prototype.setSortingType = function (sortingType) {
        this.dto.sortingType = sortingType;
        this.dao.save(this.dto);
    };
    Subscription.prototype.getFilteringList = function (type) {
        return this.dto.filteringListsByType[type];
    };
    Subscription.prototype.addKeyword = function (keyword, type) {
        this.getFilteringList(type).push(keyword);
        this.dao.save(this.dto);
    };
    Subscription.prototype.removeKeyword = function (keyword, type) {
        var keywordList = this.getFilteringList(type);
        var index = keywordList.indexOf(keyword);
        if (index > -1) {
            keywordList.splice(index, 1);
        }
        this.dao.save(this.dto);
    };
    Subscription.prototype.reset = function (type) {
        this.getFilteringList(type).length = 0;
        this.dao.save(this.dto);
    };
    return Subscription;
}());

var SubscriptionDAO = (function () {
    function SubscriptionDAO() {
        this.SUBSCRIPTION_ID_PREFIX = "subscription_";
    }
    SubscriptionDAO.prototype.save = function (dto) {
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        LocalPersistence.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    };
    SubscriptionDAO.prototype.load = function (url) {
        var subscriptionDTO = LocalPersistence.get(this.getSubscriptionId(url), null);
        if (subscriptionDTO != null) {
            console.log("Loaded saved subscription: " + JSON.stringify(subscriptionDTO));
        }
        else {
            if (this.defaultSubscription == null) {
                subscriptionDTO = new SubscriptionDTO(url);
                this.save(subscriptionDTO);
            }
            else {
                subscriptionDTO = this.clone(this.defaultSubscription, url);
            }
        }
        var subscription = new Subscription(subscriptionDTO, this);
        return subscription;
    };
    SubscriptionDAO.prototype.clone = function (dtoToClone, cloneUrl) {
        var clone = new SubscriptionDTO(cloneUrl);
        clone.filteringEnabled = dtoToClone.filteringEnabled;
        clone.restrictingEnabled = dtoToClone.restrictingEnabled;
        clone.sortingEnabled = dtoToClone.sortingEnabled;
        clone.sortingType = dtoToClone.sortingType;
        getFilteringTypes().forEach(function (type) {
            clone.filteringListsByType[type] = dtoToClone.filteringListsByType[type].slice(0);
        });
        return clone;
    };
    SubscriptionDAO.prototype.setDefaultSubscription = function (defaultSubscription) {
        this.defaultSubscription = defaultSubscription.dto;
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
    return SubscriptionDAO;
}());

var SubscriptionManager = (function () {
    function SubscriptionManager() {
        this.GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
        this.urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
        this.currentUnreadCount = 0;
        this.dao = new SubscriptionDAO();
        this.loadGlobalSettings();
        this.dao.setDefaultSubscription(this.globalSettings);
    }
    SubscriptionManager.prototype.loadSubscription = function (globalSettingsEnabled) {
        this.updateUnreadCount();
        var subscription;
        if (globalSettingsEnabled) {
            subscription = this.globalSettings;
        }
        else {
            var url = this.getSubscriptionURL();
            subscription = this.dao.load(url);
        }
        return this.currentSubscription = subscription;
    };
    SubscriptionManager.prototype.loadGlobalSettings = function () {
        this.globalSettings = this.dao.load(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL);
        return this.globalSettings;
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
    SubscriptionManager.prototype.getCurrentSubscription = function () {
        return this.currentSubscription;
    };
    SubscriptionManager.prototype.getCurrentUnreadCount = function () {
        return this.currentUnreadCount;
    };
    return SubscriptionManager;
}());

var ArticleManager = (function () {
    function ArticleManager() {
        this.articlesCount = 0;
        this.currentUnreadCount = 0;
    }
    ArticleManager.prototype.update = function (subscriptionManager) {
        this.subscription = subscriptionManager.getCurrentSubscription();
        this.currentUnreadCount = subscriptionManager.getCurrentUnreadCount();
    };
    ArticleManager.prototype.refreshArticles = function () {
        this.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.addArticle, this);
    };
    ArticleManager.prototype.resetArticles = function () {
        this.articlesCount = 0;
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
        this.articlesCount++;
        if (this.subscription.isSortingEnabled() && this.articlesCount == this.currentUnreadCount) {
            this.sortArticles();
        }
    };
    ArticleManager.prototype.sortArticles = function () {
        var _this = this;
        var sortingType = this.subscription.getSortingType();
        var articlesArray = $(ext.articleSelector).toArray();
        articlesArray.sort(function (a, b) {
            if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
                var titleA = _this.getTitle(a);
                var titleB = _this.getTitle(b);
                var sorting = titleA === titleB ? 0 : (titleA > titleB ? 1 : -1);
                if (sortingType == SortingType.TitleDesc) {
                    sorting = sorting * -1;
                }
                return sorting;
            }
            else {
                var popA = _this.getPopularity(a);
                var popB = _this.getPopularity(b);
                var i = ((sortingType == SortingType.PopularityAsc) ? 1 : -1);
                return (popA - popB) * i;
            }
        });
        var parent = $(articlesArray[0]).parent();
        parent.empty();
        articlesArray.forEach(function (article) {
            parent.append($(article));
        });
    };
    ArticleManager.prototype.getTitle = function (article) {
        return $(article).attr(ext.articleTitleAttribute).toLowerCase();
    };
    ArticleManager.prototype.getPopularity = function (article) {
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
    };
    return ArticleManager;
}());

var templates = {
    "settingsHTML": "<div id='FFnS_settingsDivContainer'> <div id='FFnS_settingsDiv'> <img id='FFnS_CloseSettingsBtn' src='{{closeIconLink}}' class='pageAction requiresLogin'> <div class='FFnS_settings'> <span class='FFnS_settings_header'>General settings: </span> <span class='FFnS_settings_span tooltip'> Auto load all unread articles <span class='tooltiptext'>Not applied if there are no unread articles</span> </span> <input id='FFnS_autoLoadAllArticles' type='checkbox'> <span class='FFnS_settings_span tooltip'> Always use global settings <span class='tooltiptext'>Use the same filtering and sorting settings for all subscriptions and categories. Uncheck to have specific settings for each subscription/category</span> </span> <input id='FFnS_globalSettingsEnabled' type='checkbox'> </div> <div class='FFnS_settings'> <span id='FFnS_subscription_title' class='FFnS_settings_header'></span> <span> <span class='FFnS_settings_span tooltip'> Filtering enabled <span class='tooltiptext'>Hide the articles that contain at least one of the filtering keywords (not applied if empty)</span> </span> <input id='FFnS_enableFiltering' type='checkbox'> </span> <span> <span class='FFnS_settings_span tooltip'> Restricting enabled <span class='tooltiptext'>Show only articles that contain at least one of the restricting keywords (not applied if empty)</span> </span> <input id='FFnS_enableRestricting' type='checkbox'> </span> <span> <span class='FFnS_settings_span'>Sorting enabled</span> <input id='FFnS_sortingEnabled' type='checkbox'> <select id='FFnS_sortingType'> <option value='{{SortingType.PopularityDesc}}'>Sort by popularity (highest to lowest)</option> <option value='{{SortingType.TitleAsc}}'>Sort by title (a -&gt; z)</option> <option value='{{SortingType.PopularityAsc}}'>Sort by popularity (lowest to highest)</option> <option value='{{SortingType.TitleDesc}}'>Sort by title (z -&gt; a)</option> </select> </span> <ul id='FFnS_tabs_menu'> <li class='current'> <a href='#FFnS_tab_FilteredOut'>Filtering keywords</a> </li> <li class=''> <a href='#FFnS_tab_RestrictedOn'>Restricting keywords</a> </li> <li class=''> <a href='#FFnS_tab_ImportMenu'>Import settings</a> </li> </ul> <div id='FFnS_tabs_content'> {{FilteringList.Type.FilteredOut}} {{FilteringList.Type.RestrictedOn}} <div id='FFnS_tab_ImportMenu' class='FFnS_Tab_Menu'> <span class='FFnS_settings_span'>Import settings from url: </span> <select id='FFnS_ImportMenu_SubscriptionSelect'> {{ImportMenu.SubscriptionOptions}} </select> <div><button id='FFnS_ImportMenu_Submit'>Import</button></div> </div> </div> </div> </div> </div>",
    "filteringListHTML": "<div id='{{FilteringTypeTabId}}' class='FFnS_Tab_Menu'> <input id='{{inputId}}' class='FFnS_input' size='10' type='text'> <span id='{{plusBtnId}}'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='{{filetringKeywordsId}}'></span> <span id='{{eraseBtnId}}'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </div>",
    "filteringKeywordHTML": "<button id='{{keywordId}}' type='button' class='FFnS_keyword'>{{keyword}}</button>",
    "optionHTML": "<option value='{{value}}'>{{value}}</option>",
    "styleCSS": "#FFnS_settingsDivContainer { display: none; background: rgba(0,0,0,0.9); width: 100%; height: 100%; z-index: 500; top: 0; left: 0; position: fixed; } #FFnS_settingsDiv { max-height: 400px; margin-top: 1%; margin-left: 15%; margin-right: 1%; border-radius: 25px; border: 2px solid #336699; background: #E0F5FF; padding: 2%; opacity: 1; } .FFnS_settings + .FFnS_settings { margin-top: 1%; } .FFnS_settings > :not(input):not(:first-child) { margin-left: 2%; } .FFnS_settings_header { color: #333690; } .FFnS_settings span + input { vertical-align: middle; } .FFnS_settings select { margin-left: 2% } #FFnS_sortingType { font-size:12px; vertical-align: middle; } #FFnS_tabs_menu { height: 30px; clear: both; margin-top: 1%; margin-bottom: 0%; padding: 0px; } #FFnS_tabs_menu li { height: 30px; line-height: 30px; display: inline-block; border: 1px solid #d4d4d1; } #FFnS_tabs_menu li.current { background-color: #B9E0ED; } #FFnS_tabs_menu li a { padding: 10px; color: #2A687D; } #FFnS_tabs_content { padding: 1%; } .FFnS_Tab_Menu { display: none; width: 100%; max-height: 340px; overflow-y: auto; overflow-x: hidden; } .FFnS_settings_span { display: inline; vertical-align: middle; } .FFnS_icon { vertical-align: middle; height: 20px; width: 20px; cursor: pointer; } .FFnS_keyword { vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer; } .FFnS_input { vertical-align: middle; } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { visibility: hidden; width: 120px; background-color: black; color: #fff; text-align: center; padding: 5px; border-radius: 6px; position: absolute; z-index: 1; } .tooltip:hover .tooltiptext { visibility: visible; } #FFnS_CloseSettingsBtn { float:right; width: 24px; height: 24px; } #FFnS_ImportMenu_Submit { margin-top: 1%; }"
};

var UIManager = (function () {
    function UIManager() {
        this.keywordToId = {};
        this.idCount = 1;
        this.settingsDivContainerId = this.getHTMLId("settingsDivContainer");
        this.closeBtnId = this.getHTMLId("CloseSettingsBtn");
        this.enableFilteringCheckId = this.getHTMLId("enableFiltering");
        this.enableRestrictingCheckId = this.getHTMLId("enableRestricting");
        this.sortingTypeId = this.getHTMLId("sortingType");
        this.sortingEnabledId = this.getHTMLId("sortingEnabled");
    }
    UIManager.prototype.init = function () {
        this.subscriptionManager = new SubscriptionManager();
        this.articleManager = new ArticleManager();
        this.autoLoadAllArticlesCB = new CheckBox("autoLoadAllArticles", this, false);
        this.globalSettingsEnabledCB = new CheckBox("globalSettingsEnabled", this);
        this.initUI();
        this.updatePage();
        this.initSettingsEvents();
    };
    UIManager.prototype.updatePage = function () {
        this.resetPage();
        this.updateSubscription();
        this.updateMenu();
    };
    UIManager.prototype.resetPage = function () {
        this.articleManager.resetArticles();
    };
    UIManager.prototype.refreshPage = function () {
        this.updatePage();
        this.refreshFilteringAndSorting();
    };
    UIManager.prototype.refreshFilteringAndSorting = function () {
        this.articleManager.refreshArticles();
    };
    UIManager.prototype.updateSubscription = function () {
        var globalSettingsEnabled = this.globalSettingsEnabledCB.isEnabled();
        this.subscription = this.subscriptionManager.loadSubscription(globalSettingsEnabled);
        this.articleManager.update(this.subscriptionManager);
        this.updateSubscriptionTitle(globalSettingsEnabled);
    };
    UIManager.prototype.updateMenu = function () {
        var _this = this;
        this.updateSubscriptionSettings();
        getFilteringTypes().forEach(function (type) {
            _this.updateFilteringList(type);
        });
        this.updateImportOptionsHTML();
    };
    UIManager.prototype.updateSubscriptionSettings = function () {
        this.setChecked(this.enableFilteringCheckId, this.subscription.isFilteringEnabled());
        this.setChecked(this.enableRestrictingCheckId, this.subscription.isRestrictingEnabled());
        this.setChecked(this.sortingEnabledId, this.subscription.isSortingEnabled());
        $id(this.sortingTypeId).val(this.subscription.getSortingType());
    };
    UIManager.prototype.updateSubscriptionTitle = function (globalSettingsEnabled) {
        var title = globalSettingsEnabled ? "Global" : "Subscription";
        title += " settings: ";
        $id("FFnS_subscription_title").text(title);
    };
    UIManager.prototype.updateImportOptionsHTML = function () {
        $id("FFnS_ImportMenu_SubscriptionSelect").html(this.getImportOptionsHTML());
    };
    UIManager.prototype.initUI = function () {
        this.initSettingsMenu();
        this.initShowSettingsBtns();
        this.autoLoadAllArticlesCB.initUI();
        this.globalSettingsEnabledCB.initUI();
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
    };
    UIManager.prototype.getFilteringListHTML = function (type) {
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
    };
    UIManager.prototype.getImportOptionsHTML = function () {
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
        getFilteringTypes().forEach(this.setUpFilteringListManagementEvents, this);
    };
    UIManager.prototype.setUpFilteringListManagementEvents = function (type) {
        var _this = this;
        var ids = this.getIds(type);
        var keywordList = this.subscription.getFilteringList(type);
        // Add button
        $id(this.getHTMLId(ids.plusBtnId)).click(function () {
            var input = $id(_this.getHTMLId(ids.inputId));
            var keyword = input.val();
            if (keyword != null && keyword !== "") {
                _this.subscription.addKeyword(keyword, type);
                _this.updateFilteringList(type);
                input.val("");
            }
        });
        // Erase all button
        $id(this.getHTMLId(ids.eraseBtnId)).click(function () {
            if (confirm("Erase all the keywords of this list ?")) {
                _this.subscription.reset(type);
                _this.updateFilteringList(type);
            }
        });
        this.setUpKeywordButtonsEvents(type);
    };
    UIManager.prototype.setUpKeywordButtonsEvents = function (type) {
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
    };
    UIManager.prototype.updateFilteringList = function (type) {
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
    };
    UIManager.prototype.addArticle = function (articleNode) {
        this.tryAutoLoadAllArticles();
        this.articleManager.addArticle(articleNode);
    };
    UIManager.prototype.tryAutoLoadAllArticles = function () {
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
            inputId: "Input_" + id,
            plusBtnId: "Add_" + id,
            eraseBtnId: "DeleteAll_" + id,
            filetringKeywordsId: "FiletringKeywords_" + id
        };
    };
    UIManager.prototype.isVisible = function (e) {
        var displayProp = e.css('display');
        return displayProp != null && displayProp != 'none';
    };
    return UIManager;
}());

var CheckBox = (function () {
    function CheckBox(id, uiManager, fullRefreshOnChange) {
        this.fullRefreshOnChange = true;
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
            this_.uiManager.refreshPage();
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
    NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
        console.log("Feedly page fully loaded");
        uiManager.init();
        NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, uiManagerBind(uiManager.updatePage));
    }, true);
});
