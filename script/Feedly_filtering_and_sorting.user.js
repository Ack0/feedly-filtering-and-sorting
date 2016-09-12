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
// @version     1.4.0
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// ==/UserScript==

var ext = {
    "filterIconLink": "https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/128/empty_filter.png",
    "plusIconLink": "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
    "eraseIconLink": "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
    "closeIconLink": "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
    "urlPrefixPattern": "https?:\/\/[^\/]+\/i\/",
    "settingsBtnPredecessorSelector": "#pageActionCustomize, #floatingPageActionCustomize",
    "articleSelector": "#timeline > [id$='column0'] > div",
    "sectionSelector": "#timeline > .section",
    "articleLinkSelector": "a[id$=\"_main_title\"]",
    "publishAgeSpanSelector": ".lastModified > span",
    "publishAgeTimestampAttr": "title",
    "readArticleClass": "read",
    "subscriptionChangeSelector": "h1#feedlyTitleBar > .hhint",
    "articleTitleAttribute": "data-title",
    "articleEntryIdAttribute": "data-entryid",
    "popularitySelector": ".nbrRecommendations",
    "unreadCountSelector": ".hhint > [class*='UnreadCount']",
    "fullyLoadedArticlesSelector": "#fullyLoadedFollowing",
    "magazineView": "u4Entry",
    "magazineAgeSuccessorSelector": "span.wikiBar",
    "cardsView": "u5Entry",
    "fullArticlesView": "u100Frame",
    "fullArticlesAgePredecessorSelector": "a.sourceTitle",
    "magazineTopEntryClass": "topRecommendedEntry",
    "magazineTopEntrySelector": "div.topRecommendedEntry",
    "magazineTopEntryTitleSelector": "a.title",
    "lastReadEntryId": "lastReadEntry",
    "keepNewArticlesUnreadId": "keepNewArticlesUnread",
    "articlesToMarkAsReadId": "articlesToMarkAsRead"
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
function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function isRadioChecked(input) {
    return input.is(':checked');
}
function setRadioChecked(htmlId, checked) {
    $id(htmlId).prop('checked', checked);
}
function registerAccessors(srcObject, srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, fieldObjectName) {
    for (var field in srcObject) {
        var type = typeof (srcObject[field]);
        if (type === "object") {
            if ($.isArray(srcObject[field])) {
            }
            else {
                registerAccessors(srcObject[field], srcFieldName, targetPrototype, setterCallback, setterCallbackThisArg, field);
            }
        }
        else if (type !== "function") {
            var accessorName = capitalizeFirst(field);
            if (fieldObjectName != null) {
                accessorName += "_" + capitalizeFirst(fieldObjectName);
            }
            var getterName = (type === "boolean" ? "is" : "get") + accessorName;
            var setterName = "set" + accessorName;
            (function () {
                var callbackField = field;
                var getFinalObj = function (callbackSrcObj) {
                    return fieldObjectName == null ? callbackSrcObj : callbackSrcObj[fieldObjectName];
                };
                if (targetPrototype[getterName] == null) {
                    targetPrototype[getterName] = function () {
                        var finalObj = getFinalObj(this[srcFieldName]);
                        return finalObj[callbackField];
                    };
                }
                if (targetPrototype[setterName] == null) {
                    targetPrototype[setterName] = function (value) {
                        var callbackSrcObj = this[srcFieldName];
                        var finalObj = getFinalObj(callbackSrcObj);
                        finalObj[callbackField] = value;
                        setterCallback.call(setterCallbackThisArg, callbackSrcObj);
                    };
                }
            })();
        }
    }
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
(function (HTMLElementType) {
    HTMLElementType[HTMLElementType["SelectBox"] = 0] = "SelectBox";
    HTMLElementType[HTMLElementType["CheckBox"] = 1] = "CheckBox";
    HTMLElementType[HTMLElementType["NumberInput"] = 2] = "NumberInput";
})(exported.HTMLElementType || (exported.HTMLElementType = {}));
var HTMLElementType = exported.HTMLElementType;
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
    LocalPersistence.delete = function (id) {
        GM_deleteValue(id);
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
        this.advancedControlsReceivedPeriod = new AdvancedControlsReceivedPeriod();
        this.pinHotToTop = false;
        this.filteringListsByType = {};
        this.url = url;
        getFilteringTypes().forEach(function (type) {
            _this.filteringListsByType[type] = [];
        });
    }
    return SubscriptionDTO;
}());
var AdvancedControlsReceivedPeriod = (function () {
    function AdvancedControlsReceivedPeriod() {
        this.maxHours = 6;
        this.keepUnread = false;
        this.hide = false;
        this.showIfHot = false;
        this.minPopularity = 200;
        this.markAsReadVisible = false;
    }
    return AdvancedControlsReceivedPeriod;
}());

var Subscription = (function () {
    function Subscription(url, dao) {
        this.dao = dao;
        this.update(url, true);
    }
    Subscription.prototype.update = function (url, skipSave) {
        var dto = this.dao.load(url);
        var cloneURL = this.dto == null ? dto.url : this.getURL();
        this.dto = this.dao.clone(dto, cloneURL);
        if (!skipSave) {
            this.dao.save(this.dto);
        }
    };
    Subscription.prototype.getURL = function () {
        return this.dto.url;
    };
    Subscription.prototype.isFilteringEnabled = function () {
        return this.dto.filteringEnabled;
    };
    Subscription.prototype.isRestrictingEnabled = function () {
        return this.dto.restrictingEnabled;
    };
    Subscription.prototype.isSortingEnabled = function () {
        return this.dto.sortingEnabled;
    };
    Subscription.prototype.isPinHotToTop = function () {
        return this.dto.pinHotToTop;
    };
    Subscription.prototype.getAdvancedControlsReceivedPeriod = function () {
        return this.dto.advancedControlsReceivedPeriod;
    };
    Subscription.prototype.getSortingType = function () {
        return this.dto.sortingType;
    };
    Subscription.prototype.getFilteringList = function (type) {
        return this.dto.filteringListsByType[type];
    };
    Subscription.prototype.setHours_AdvancedControlsReceivedPeriod = function (hours) {
        if (hours > 23) {
            return;
        }
        var advancedPeriodDays = Math.floor(this.getAdvancedControlsReceivedPeriod().maxHours / 24);
        this.setMaxHours_AdvancedControlsReceivedPeriod(hours, advancedPeriodDays);
    };
    Subscription.prototype.setDays_AdvancedControlsReceivedPeriod = function (days) {
        var advancedPeriodHours = this.getAdvancedControlsReceivedPeriod().maxHours % 24;
        this.setMaxHours_AdvancedControlsReceivedPeriod(advancedPeriodHours, days);
    };
    Subscription.prototype.setMaxHours_AdvancedControlsReceivedPeriod = function (hours, days) {
        var maxHours = hours + 24 * days;
        this.getAdvancedControlsReceivedPeriod().maxHours = maxHours;
        this.dao.save(this.dto);
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
    Subscription.prototype.resetFilteringList = function (type) {
        this.getFilteringList(type).length = 0;
        this.dao.save(this.dto);
    };
    return Subscription;
}());

var SubscriptionDAO = (function () {
    function SubscriptionDAO() {
        this.SUBSCRIPTION_ID_PREFIX = "subscription_";
        this.GLOBAL_SETTINGS_SUBSCRIPTION_URL = "---global settings---";
        registerAccessors(new SubscriptionDTO(""), "dto", Subscription.prototype, this.save, this);
    }
    SubscriptionDAO.prototype.save = function (dto) {
        var url = dto.url;
        var id = this.getSubscriptionId(url);
        LocalPersistence.put(id, dto);
        console.log("Subscription saved: " + JSON.stringify(dto));
    };
    SubscriptionDAO.prototype.load = function (url) {
        var subscriptionDTO;
        var id = this.getSubscriptionId(url);
        var dto = LocalPersistence.get(id, null);
        if (dto != null) {
            var linkedURL = dto.linkedUrl;
            if (linkedURL != null) {
                console.log("Loading linked subscription: " + linkedURL);
                subscriptionDTO = this.load(linkedURL);
            }
            else {
                subscriptionDTO = dto;
                console.log("Loaded saved subscription: " + JSON.stringify(subscriptionDTO));
            }
        }
        if (subscriptionDTO == null) {
            if (this.defaultSubscriptionDTO == null) {
                subscriptionDTO = new SubscriptionDTO(url);
                this.save(subscriptionDTO);
            }
            else {
                subscriptionDTO = this.clone(this.defaultSubscriptionDTO, url);
            }
        }
        return subscriptionDTO;
    };
    SubscriptionDAO.prototype.delete = function (url) {
        LocalPersistence.delete(this.getSubscriptionId(url));
        console.log("Deleted: " + url);
    };
    SubscriptionDAO.prototype.clone = function (dtoToClone, cloneUrl) {
        var clone = new SubscriptionDTO(cloneUrl);
        if (dtoToClone == null) {
            return clone;
        }
        var defDto = this.defaultSubscriptionDTO != null ? this.defaultSubscriptionDTO : clone;
        clone.filteringEnabled = (dtoToClone.filteringEnabled != null) ? dtoToClone.filteringEnabled : defDto.filteringEnabled;
        clone.restrictingEnabled = (dtoToClone.restrictingEnabled != null) ? dtoToClone.restrictingEnabled : defDto.restrictingEnabled;
        clone.sortingEnabled = (dtoToClone.sortingEnabled != null) ? dtoToClone.sortingEnabled : defDto.sortingEnabled;
        clone.sortingType = (dtoToClone.sortingType != null) ? dtoToClone.sortingType : defDto.sortingType;
        clone.pinHotToTop = (dtoToClone.pinHotToTop != null) ? dtoToClone.pinHotToTop : defDto.pinHotToTop;
        clone.advancedControlsReceivedPeriod = this.cloneAdvancedControlsReceivedPeriod(dtoToClone);
        var filteringListsByTypeToClone = (dtoToClone.filteringListsByType != null) ? dtoToClone.filteringListsByType : defDto.filteringListsByType;
        getFilteringTypes().forEach(function (type) {
            clone.filteringListsByType[type] = filteringListsByTypeToClone[type].slice(0);
        });
        return clone;
    };
    SubscriptionDAO.prototype.cloneAdvancedControlsReceivedPeriod = function (dtoToClone) {
        var advCtrols = new AdvancedControlsReceivedPeriod();
        var advCtrolsToClone = dtoToClone.advancedControlsReceivedPeriod;
        if (advCtrolsToClone == null) {
            return advCtrols;
        }
        var defAdvCtrols = this.defaultSubscriptionDTO != null ? this.defaultSubscriptionDTO.advancedControlsReceivedPeriod : advCtrols;
        advCtrols.maxHours = (advCtrolsToClone.maxHours != null) ? advCtrolsToClone.maxHours : defAdvCtrols.maxHours;
        advCtrols.keepUnread = (advCtrolsToClone.keepUnread != null) ? advCtrolsToClone.keepUnread : defAdvCtrols.keepUnread;
        advCtrols.hide = (advCtrolsToClone.hide != null) ? advCtrolsToClone.hide : defAdvCtrols.hide;
        advCtrols.showIfHot = (advCtrolsToClone.showIfHot != null) ? advCtrolsToClone.showIfHot : defAdvCtrols.showIfHot;
        advCtrols.minPopularity = (advCtrolsToClone.minPopularity != null) ? advCtrolsToClone.minPopularity : defAdvCtrols.minPopularity;
        advCtrols.markAsReadVisible = (advCtrolsToClone.markAsReadVisible != null) ? advCtrolsToClone.markAsReadVisible : defAdvCtrols.markAsReadVisible;
        return advCtrols;
    };
    SubscriptionDAO.prototype.loadGlobalSettings = function () {
        var globalSettings = new Subscription(this.GLOBAL_SETTINGS_SUBSCRIPTION_URL, this);
        this.defaultSubscriptionDTO = globalSettings.dto;
        return globalSettings;
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
    SubscriptionDAO.prototype.linkSubscriptions = function (url, linkedURL) {
        var id = this.getSubscriptionId(url);
        var linkedSub = new LinkedSubscriptionDTO(linkedURL);
        LocalPersistence.put(id, linkedSub);
        console.log("Subscription linked: " + JSON.stringify(linkedSub));
    };
    SubscriptionDAO.prototype.isURLGlobal = function (url) {
        return url === this.GLOBAL_SETTINGS_SUBSCRIPTION_URL;
    };
    return SubscriptionDAO;
}());
var LinkedSubscriptionDTO = (function () {
    function LinkedSubscriptionDTO(linkedUrl) {
        this.linkedUrl = linkedUrl;
    }
    return LinkedSubscriptionDTO;
}());

var SubscriptionManager = (function () {
    function SubscriptionManager() {
        this.urlPrefixPattern = new RegExp(ext.urlPrefixPattern, "i");
        this.dao = new SubscriptionDAO();
    }
    SubscriptionManager.prototype.loadSubscription = function (globalSettingsEnabled) {
        var subscription;
        if (globalSettingsEnabled) {
            subscription = this.dao.loadGlobalSettings();
        }
        else {
            subscription = new Subscription(this.getActualSubscriptionURL(), this.dao);
        }
        return this.currentSubscription = subscription;
    };
    SubscriptionManager.prototype.linkToSubscription = function (url) {
        if (url === this.getActualSubscriptionURL()) {
            alert("Linking to the same subscription URL is impossible");
        }
        else {
            this.dao.linkSubscriptions(this.getActualSubscriptionURL(), url);
        }
    };
    SubscriptionManager.prototype.deleteSubscription = function (url) {
        this.dao.delete(url);
    };
    SubscriptionManager.prototype.importKeywords = function (url) {
        this.currentSubscription.update(url);
    };
    SubscriptionManager.prototype.getAllSubscriptionURLs = function () {
        return this.dao.getAllSubscriptionURLs();
    };
    SubscriptionManager.prototype.getActualSubscriptionURL = function () {
        return document.URL.replace(this.urlPrefixPattern, "");
    };
    SubscriptionManager.prototype.isGlobalMode = function () {
        return this.dao.isURLGlobal(this.currentSubscription.getURL());
    };
    SubscriptionManager.prototype.getCurrentSubscription = function () {
        return this.currentSubscription;
    };
    return SubscriptionManager;
}());

var ArticleManager = (function () {
    function ArticleManager(subscriptionManager) {
        this.articlesCount = 0;
        this.lastReadArticleAge = -1;
        this.hiddingInfoClass = "FFnS_Hidding_Info";
        this.eval = window["eval"];
        this.subscriptionManager = subscriptionManager;
        this.eval("(" + this.overrideMarkAsRead.toString() + ")();");
        this.eval("window.ext = (" + JSON.stringify(ext).replace(/\s+/g, ' ') + ");");
    }
    ArticleManager.prototype.refreshArticles = function () {
        this.resetArticles();
        $(ext.articleSelector).toArray().forEach(this.addArticle, this);
        $(ext.magazineTopEntrySelector).toArray().forEach(this.addMagazineTopEntry, this);
    };
    ArticleManager.prototype.resetArticles = function () {
        this.articlesCount = 0;
        this.lastReadArticleAge = -1;
        this.lastReadArticleGroup = [];
        this.articlesToMarkAsRead = [];
        this.clearHiddingInfo();
        this.eval("window.FFnS = ({});");
    };
    ArticleManager.prototype.getCurrentSub = function () {
        return this.subscriptionManager.getCurrentSubscription();
    };
    ArticleManager.prototype.getCurrentUnreadCount = function () {
        return $(ext.articleSelector).length;
    };
    ArticleManager.prototype.addArticle = function (a) {
        var article = new Article(a);
        this.filterAndRestrict(article);
        this.advancedControls(article);
        this.articlesCount++;
        this.checkLastAddedArticle();
    };
    ArticleManager.prototype.addMagazineTopEntry = function (a) {
        var article = new Article(a);
        this.filterAndRestrict(article);
    };
    ArticleManager.prototype.filterAndRestrict = function (article) {
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
            }
            else {
                article.css("display", "");
            }
        }
        else {
            article.css("display", "");
        }
    };
    ArticleManager.prototype.advancedControls = function (article) {
        if (article.get().hasClass(ext.cardsView)) {
            return; // No publish age in card view
        }
        var sub = this.getCurrentSub();
        var advControls = sub.getAdvancedControlsReceivedPeriod();
        if (advControls.keepUnread || advControls.hide) {
            try {
                var threshold = Date.now() - advControls.maxHours * 3600 * 1000;
                var publishAge = article.getPublishAge();
                if (publishAge <= threshold) {
                    if (advControls.keepUnread && (this.lastReadArticleAge == -1 ||
                        publishAge >= this.lastReadArticleAge)) {
                        if (publishAge != this.lastReadArticleAge) {
                            this.lastReadArticleGroup = [article];
                        }
                        else {
                            this.lastReadArticleGroup.push(article);
                        }
                        this.lastReadArticleAge = publishAge;
                    }
                }
                else {
                    if (advControls.hide) {
                        if (advControls.showIfHot && (article.isHot()
                            || article.getPopularity() >= advControls.minPopularity)) {
                            if (advControls.keepUnread && advControls.markAsReadVisible) {
                                this.articlesToMarkAsRead.push(article);
                            }
                        }
                        else {
                            article.css("display", "none");
                        }
                    }
                }
            }
            catch (err) {
                console.log(err);
            }
        }
    };
    ArticleManager.prototype.checkLastAddedArticle = function () {
        var sub = this.getCurrentSub();
        if (this.articlesCount == this.getCurrentUnreadCount()) {
            if (this.lastReadArticleGroup.length > 0) {
                var lastReadArticle;
                if (this.isOldestFirst()) {
                    lastReadArticle = this.lastReadArticleGroup[this.lastReadArticleGroup.length - 1];
                }
                else {
                    lastReadArticle = this.lastReadArticleGroup[0];
                }
                if (lastReadArticle != null) {
                    this.putWindow(ext.lastReadEntryId, lastReadArticle.getEntryId());
                }
            }
            if (this.articlesToMarkAsRead.length > 0) {
                var ids = this.articlesToMarkAsRead.map(function (article) {
                    return article.getEntryId();
                });
                this.putWindow(ext.articlesToMarkAsReadId, ids);
            }
            if (sub.isSortingEnabled()) {
                this.sortArticles();
            }
            if (sub.getAdvancedControlsReceivedPeriod().keepUnread) {
                this.putWindow(ext.keepNewArticlesUnreadId, true);
            }
            this.showHiddingInfo();
        }
    };
    ArticleManager.prototype.sortArticles = function () {
        var articlesArray = $.map($(ext.articleSelector).toArray(), (function (a) {
            return new Article(a);
        }));
        if (this.getCurrentSub().isPinHotToTop()) {
            var hotArticles = [];
            var normalArticles = [];
            articlesArray.forEach(function (article) {
                if (article.isHot()) {
                    hotArticles.push(article);
                }
                else {
                    normalArticles.push(article);
                }
            });
            this.sortArticleArray(hotArticles);
            this.sortArticleArray(normalArticles);
            articlesArray = hotArticles.concat(normalArticles);
        }
        else {
            this.sortArticleArray(articlesArray);
        }
        var articlesContainer = $(ext.articleSelector).first().parent();
        articlesContainer.empty();
        articlesArray.forEach(function (article) {
            articlesContainer.append(article.get());
        });
    };
    ArticleManager.prototype.sortArticleArray = function (articles) {
        var sortingType = this.getCurrentSub().getSortingType();
        articles.sort(function (a, b) {
            if (sortingType == SortingType.TitleAsc || sortingType == SortingType.TitleDesc) {
                var titleA = a.getTitle();
                var titleB = b.getTitle();
                var sorting = titleA === titleB ? 0 : (titleA > titleB ? 1 : -1);
                if (sortingType == SortingType.TitleDesc) {
                    sorting = sorting * -1;
                }
                return sorting;
            }
            else {
                var popA = a.getPopularity();
                var popB = b.getPopularity();
                var i = ((sortingType == SortingType.PopularityAsc) ? 1 : -1);
                return (popA - popB) * i;
            }
        });
    };
    ArticleManager.prototype.isOldestFirst = function () {
        try {
            var firstPublishAge = new Article($(ext.articleSelector).first().get(0)).getPublishAge();
            var lastPublishAge = new Article($(ext.articleSelector).last().get(0)).getPublishAge();
            return firstPublishAge < lastPublishAge;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    };
    ArticleManager.prototype.showHiddingInfo = function () {
        var hiddenCount = 0;
        $(ext.articleSelector).each(function (i, a) {
            if ($(a).css("display") === "none") {
                hiddenCount++;
            }
        });
        if (hiddenCount == 0) {
            return;
        }
        this.clearHiddingInfo();
        $(ext.unreadCountSelector).after("<span class=" + this.hiddingInfoClass + ">(" + hiddenCount + " hidden)</span>");
    };
    ArticleManager.prototype.clearHiddingInfo = function () {
        $("." + this.hiddingInfoClass).remove();
    };
    ArticleManager.prototype.putWindow = function (id, value) {
        this.eval("window.FFnS['" + id + "'] = " + JSON.stringify(value) + ";");
    };
    /* No JQuery */
    ArticleManager.prototype.overrideMarkAsRead = function () {
        var pagesPkg = window["devhd"].pkg("pages");
        function getFromWindow(id) {
            return window["FFnS"][id];
        }
        function markEntryAsRead(id, thisArg) {
            pagesPkg.BasePage.prototype.buryEntry.call(thisArg, id);
        }
        function getLastReadEntry(oldLastEntryObject, thisArg) {
            if (getFromWindow(ext.keepNewArticlesUnreadId) == null) {
                return oldLastEntryObject;
            }
            var idsToMarkAsRead = getFromWindow(ext.articlesToMarkAsReadId);
            if (idsToMarkAsRead != null) {
                idsToMarkAsRead.forEach(function (id) {
                    markEntryAsRead(id, thisArg);
                });
            }
            var lastReadEntryId = getFromWindow(ext.lastReadEntryId);
            if (lastReadEntryId == null) {
                return null;
            }
            return { lastReadEntryId: lastReadEntryId };
        }
        var feedlyListPagePrototype = pagesPkg.ListPage.prototype;
        var oldMarkAllAsRead = feedlyListPagePrototype.markAllSubscriptionEntriesAsRead;
        feedlyListPagePrototype.markAllSubscriptionEntriesAsRead = function (subURL, b, oldLastEntryObject, d) {
            var lastEntryObject = getLastReadEntry(oldLastEntryObject, this);
            if (lastEntryObject != null) {
                oldMarkAllAsRead.call(this, subURL, b, lastEntryObject, d);
            }
        };
        var oldMarkCategoryAsRead = feedlyListPagePrototype.markCategoryAsRead;
        feedlyListPagePrototype.markCategoryAsRead = function (categoryName, oldLastEntryObject, c, d) {
            var lastEntryObject = getLastReadEntry(oldLastEntryObject, this);
            if (lastEntryObject != null) {
                oldMarkCategoryAsRead.call(this, categoryName, lastEntryObject, c, d);
            }
        };
    };
    return ArticleManager;
}());
var Article = (function () {
    function Article(article) {
        this.article = $(article);
    }
    Article.prototype.get = function () {
        return this.article;
    };
    Article.prototype.getTitle = function () {
        var title;
        if (this.article.hasClass(ext.magazineTopEntryClass)) {
            title = this.article.find(ext.magazineTopEntryTitleSelector).text();
        }
        else {
            title = this.article.attr(ext.articleTitleAttribute);
        }
        return title.trim().toLowerCase();
    };
    Article.prototype.getPopularity = function () {
        var popularityStr = this.article.find(ext.popularitySelector).text().trim();
        popularityStr = popularityStr.replace("+", "");
        if (popularityStr.indexOf("K") > -1) {
            popularityStr = popularityStr.replace("K", "");
            popularityStr += "000";
        }
        var popularityNumber = Number(popularityStr);
        return popularityNumber;
    };
    Article.prototype.getPublishAge = function () {
        var ageStr;
        if (this.article.hasClass(ext.fullArticlesView)) {
            ageStr = this.article.find(ext.fullArticlesAgePredecessorSelector).next().attr(ext.publishAgeTimestampAttr);
        }
        else if (this.article.hasClass(ext.magazineView)) {
            ageStr = this.article.find(ext.magazineAgeSuccessorSelector).prev().attr(ext.publishAgeTimestampAttr);
        }
        else {
            ageStr = this.article.find(ext.publishAgeSpanSelector).attr(ext.publishAgeTimestampAttr);
        }
        var publishDate = ageStr.split("--")[1].replace(/[^:]*:/, "").trim();
        var publishDateMs = Date.parse(publishDate);
        return publishDateMs;
    };
    Article.prototype.isHot = function () {
        var span = this.article.find(ext.popularitySelector);
        return span.hasClass("hot") || span.hasClass("onfire");
    };
    Article.prototype.getEntryId = function () {
        return this.article.attr(ext.articleEntryIdAttribute);
    };
    Article.prototype.css = function (propertyName, value) {
        this.article.css(propertyName, value);
    };
    return Article;
}());

var templates = {
    "settingsHTML": "<div id='FFnS_settingsDivContainer'> <div id='FFnS_settingsDiv'> <img id='FFnS_CloseSettingsBtn' src='{{closeIconLink}}' class='pageAction requiresLogin'> <fieldset><legend>General settings</legend> <span class='setting_group'> <span class='tooltip'> Auto load all unread articles <span class='tooltiptext'>Not applied if there are no unread articles</span> </span> <input id='FFnS_autoLoadAllArticles' type='checkbox'> </span> <span class='setting_group'> <span class='tooltip'> Always use global settings <span class='tooltiptext'>Use the same filtering and sorting settings for all subscriptions and categories. Uncheck to have specific settings for each subscription/category</span> </span> <input id='FFnS_globalSettingsEnabled' type='checkbox'> </span> </fieldset> <fieldset><legend><span id='FFnS_subscription_title'></span></legend> <span class='setting_group'> <span class='tooltip'> Filtering enabled <span class='tooltiptext'>Hide the articles that contain at least one of the filtering keywords (not applied if empty)</span> </span> <input id='FFnS_FilteringEnabled' type='checkbox'> </span> <span class='setting_group'> <span class='tooltip'> Restricting enabled <span class='tooltiptext'>Show only articles that contain at least one of the restricting keywords (not applied if empty)</span> </span> <input id='FFnS_RestrictingEnabled' type='checkbox'> </span> <span class='setting_group'> <span>Sorting enabled</span> <input id='FFnS_SortingEnabled' type='checkbox'> <select id='FFnS_SortingType' class='FFnS_input'> <option value='{{SortingType.PopularityDesc}}'>Sort by popularity (highest to lowest)</option> <option value='{{SortingType.TitleAsc}}'>Sort by title (a -&gt; z)</option> <option value='{{SortingType.PopularityAsc}}'>Sort by popularity (lowest to highest)</option> <option value='{{SortingType.TitleDesc}}'>Sort by title (z -&gt; a)</option> </select> </span> <ul id='FFnS_tabs_menu'> <li class='current'> <a href='#FFnS_Tab_FilteredOut'>Filtering keywords</a> </li> <li> <a href='#FFnS_Tab_RestrictedOn'>Restricting keywords</a> </li> <li> <a href='#FFnS_Tab_AdvancedControls'>Advanced controls</a> </li> <li> <a href='#FFnS_Tab_SettingsControls'>Settings controls</a> </li> </ul> <div id='FFnS_tabs_content'> {{FilteringList.Type.FilteredOut}} {{FilteringList.Type.RestrictedOn}} <div id='FFnS_Tab_AdvancedControls' class='FFnS_Tab_Menu'> <fieldset><legend>Recently published articles</legend> <div id='FFnS_MaxPeriod_Infos'> <span>Articles published less than</span> <input id='FFnS_Hours_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' max='23'> <span>hours and</span> <input id='FFnS_Days_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0'> <span>days</span> <span>ago should be:</span> </div> <span class='setting_group'> <span>Kept unread</span> <input id='FFnS_KeepUnread_AdvancedControlsReceivedPeriod' type='checkbox'> </span> <span class='setting_group'> <span>Hidden</span> <input id='FFnS_Hide_AdvancedControlsReceivedPeriod' type='checkbox'> </span> <span class='setting_group'> <span>Visible if hot or popularity superior to:</span> <input id='FFnS_MinPopularity_AdvancedControlsReceivedPeriod' class='FFnS_input' type='number' min='0' step='100'> <input id='FFnS_ShowIfHot_AdvancedControlsReceivedPeriod' type='checkbox'> </span> <span class='setting_group'> <span>Marked as read if visible:</span> <input id='FFnS_MarkAsReadVisible_AdvancedControlsReceivedPeriod' type='checkbox'> </span> </fieldset> <fieldset><legend>Hot articles</legend> <span class='setting_group'> <span>Group hot articles & pin to top</span> <input id='FFnS_PinHotToTop' type='checkbox'> </span> </fieldset> </div> <div id='FFnS_Tab_SettingsControls' class='FFnS_Tab_Menu'> <span>Selected subscription:</span> <select id='FFnS_SettingsControls_SelectedSubscription' class='FFnS_input'> {{ImportMenu.SubscriptionOptions}} </select> <button id='FFnS_SettingsControls_ImportFromOtherSub'>Import settings from selected subscription</button> <button id='FFnS_SettingsControls_DeleteSub'>Delete selected subscription</button> <fieldset><legend>Linking</legend> <div id='FFnS_SettingsControls_LinkedSubContainer'> <span id='FFnS_SettingsControls_LinkedSub'></span> <button id='FFnS_SettingsControls_UnlinkFromSub'>Unlink</button> </div> <button id='FFnS_SettingsControls_LinkToSub'>Link current subscription to selected subscription</button> </fieldset> </div> </div> </fieldset> </div> </div>",
    "filteringListHTML": "<div id='{{FilteringTypeTabId}}' class='FFnS_Tab_Menu'> <input id='{{inputId}}' class='FFnS_input' size='10' type='text'> <span id='{{plusBtnId}}'> <img src='{{plusIconLink}}' class='FFnS_icon' /> </span> <span id='{{filetringKeywordsId}}'></span> <span id='{{eraseBtnId}}'> <img src='{{eraseIconLink}}' class='FFnS_icon' /> </span> </div>",
    "filteringKeywordHTML": "<button id='{{keywordId}}' type='button' class='FFnS_keyword'>{{keyword}}</button>",
    "optionHTML": "<option value='{{value}}'>{{value}}</option>",
    "styleCSS": "#FFnS_settingsDivContainer { display: none; background: rgba(0,0,0,0.9); width: 100%; height: 100%; z-index: 500; top: 0; left: 0; position: fixed; } #FFnS_settingsDiv { max-height: 400px; margin-top: 1%; margin-left: 15%; margin-right: 1%; border-radius: 25px; border: 2px solid #336699; background: #E0F5FF; padding: 2%; opacity: 1; } .FFnS_input { font-size:12px; } #FFnS_tabs_menu { height: 30px; clear: both; margin-top: 1%; margin-bottom: 0%; padding: 0px; text-align: center; } #FFnS_tabs_menu li { height: 30px; line-height: 30px; display: inline-block; border: 1px solid #d4d4d1; } #FFnS_tabs_menu li.current { background-color: #B9E0ED; } #FFnS_tabs_menu li a { padding: 10px; color: #2A687D; } #FFnS_tabs_content { padding: 1%; } .FFnS_Tab_Menu { display: none; width: 100%; max-height: 200px; overflow-y: auto; overflow-x: hidden; } .FFnS_icon { vertical-align: middle; height: 20px; width: 20px; cursor: pointer; } .FFnS_keyword { vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer; } .tooltip { position: relative; display: inline-block; border-bottom: 1px dotted black; } .tooltip .tooltiptext { visibility: hidden; width: 120px; background-color: black; color: #fff; text-align: center; padding: 5px; border-radius: 6px; position: absolute; z-index: 1; white-space: normal; } .tooltip:hover .tooltiptext { visibility: visible; } #FFnS_CloseSettingsBtn { float:right; width: 24px; height: 24px; } #FFnS_Tab_SettingsControls button { margin-top: 1%; font-size: 12px; display: block; } #FFnS_Tab_SettingsControls #FFnS_SettingsControls_UnlinkFromSub { display: inline; } #FFnS_MaxPeriod_Infos > input[type=number]{ width: 30px; margin-left: 1%; margin-right: 1%; } #FFnS_MinPopularity_AdvancedControlsReceivedPeriod { width: 45px; } #FFnS_MaxPeriod_Infos { margin: 1% 0 2% 0; } .setting_group { white-space: nowrap; margin-right: 2%; } fieldset { border-color: #333690; border-style: sold; } legend { color: #333690; font-weight: bold; } fieldset + fieldset, #FFnS_Tab_SettingsControls fieldset { margin-top: 1%; } fieldset select { margin-left: 2% } input { vertical-align: middle; } "
};

var UIManager = (function () {
    function UIManager() {
        this.containsReadArticles = false;
        this.keywordToId = {};
        this.idCount = 1;
        this.htmlSettingsElements = [
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
        this.settingsDivContainerId = this.getHTMLId("settingsDivContainer");
        this.closeBtnId = this.getHTMLId("CloseSettingsBtn");
    }
    UIManager.prototype.init = function () {
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
        }
        catch (err) {
            console.log(err);
        }
    };
    UIManager.prototype.updatePage = function () {
        try {
            this.resetPage();
            this.updateSubscription();
            this.updateMenu();
        }
        catch (err) {
            console.log(err);
        }
    };
    UIManager.prototype.resetPage = function () {
        this.containsReadArticles = false;
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
        this.updateSubscriptionTitle(globalSettingsEnabled);
    };
    UIManager.prototype.updateMenu = function () {
        var _this = this;
        this.updateSubscriptionSettings();
        getFilteringTypes().forEach(function (type) {
            _this.updateFilteringList(type);
        });
        this.updateSettingsControls();
    };
    UIManager.prototype.updateSubscriptionSettings = function () {
        this.htmlSubscriptionManager.update();
    };
    UIManager.prototype.updateSubscriptionTitle = function (globalSettingsEnabled) {
        var title = globalSettingsEnabled ? "Global" : "Subscription";
        title += " settings";
        $id("FFnS_subscription_title").text(title);
    };
    UIManager.prototype.updateSettingsControls = function () {
        $id("FFnS_SettingsControls_SelectedSubscription").html(this.getImportOptionsHTML());
        var linkedSubContainer = $id("FFnS_SettingsControls_LinkedSubContainer");
        var linkedSub = $id("FFnS_SettingsControls_LinkedSub");
        if (((!this.globalSettingsEnabledCB.isEnabled()) && this.subscription.getURL() !== this.subscriptionManager.getActualSubscriptionURL()) ||
            (this.globalSettingsEnabledCB.isEnabled() && !this.subscriptionManager.isGlobalMode())) {
            linkedSubContainer.css("display", "");
            linkedSub.text("Subscription currently linked to: " + this.subscription.getURL());
        }
        else {
            linkedSubContainer.css("display", "none");
            linkedSub.text("");
        }
    };
    UIManager.prototype.getSettingsControlsSelectedSubscription = function () {
        return $id("FFnS_SettingsControls_SelectedSubscription").val();
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
        NodeCreationObserver.onCreation(ext.settingsBtnPredecessorSelector, function (element) {
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
    };
    UIManager.prototype.registerSettings = function () {
        var _this = this;
        this.htmlSettingsElements.forEach(function (element) {
            _this.htmlSubscriptionManager.registerSettings(element.ids, element.type);
        });
        this.htmlSubscriptionManager.registerSettings(["Hours_AdvancedControlsReceivedPeriod", "Days_AdvancedControlsReceivedPeriod"], HTMLElementType.NumberInput, {
            update: function (subscriptionSetting) {
                var advancedControlsReceivedPeriod = subscriptionSetting.manager.subscription.getAdvancedControlsReceivedPeriod();
                var maxHours = advancedControlsReceivedPeriod.maxHours;
                var advancedPeriodHours = maxHours % 24;
                var advancedPeriodDays = Math.floor(maxHours / 24);
                if (subscriptionSetting.id.indexOf("Hours") != -1) {
                    $id(subscriptionSetting.htmlId).val(advancedPeriodHours);
                }
                else {
                    $id(subscriptionSetting.htmlId).val(advancedPeriodDays);
                }
            }
        });
    };
    UIManager.prototype.initSettingsCallbacks = function () {
        var _this = this;
        var this_ = this;
        this.htmlSubscriptionManager.setUpCallbacks();
        $id(this.closeBtnId).click(function () {
            $id(this_.settingsDivContainerId).toggle();
        });
        $id("FFnS_SettingsControls_ImportFromOtherSub").click(function () {
            _this.importFromOtherSub();
        });
        $id("FFnS_SettingsControls_LinkToSub").click(function () {
            _this.linkToSub();
        });
        $id("FFnS_SettingsControls_UnlinkFromSub").click(function () {
            _this.unlinkFromSub();
        });
        $id("FFnS_SettingsControls_DeleteSub").click(function () {
            _this.deleteSub();
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
                _this.subscription.resetFilteringList(type);
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
    UIManager.prototype.addArticle = function (article) {
        try {
            this.checkReadArticles(article);
            if (this.containsReadArticles) {
                return;
            }
            this.articleManager.addArticle(article);
            this.tryAutoLoadAllArticles();
        }
        catch (err) {
            console.log(err);
        }
    };
    UIManager.prototype.addMagazineTopEntry = function (article) {
        try {
            this.articleManager.addMagazineTopEntry(article);
        }
        catch (err) {
            console.log(err);
        }
    };
    UIManager.prototype.addSection = function (section) {
        if (section.id === "section0") {
            $(section).find("h2").text(" ");
        }
        else {
            $(section).remove();
        }
    };
    UIManager.prototype.checkReadArticles = function (article) {
        if (!this.containsReadArticles) {
            this.containsReadArticles = $(article).find(ext.articleLinkSelector).hasClass(ext.readArticleClass);
            if (this.containsReadArticles) {
                this.articleManager.resetArticles();
                window.scrollTo(0, 0);
            }
        }
    };
    UIManager.prototype.tryAutoLoadAllArticles = function () {
        if (!this.autoLoadAllArticlesCB.isEnabled()) {
            return;
        }
        if (this.isVisible($(ext.fullyLoadedArticlesSelector))) {
            window.scrollTo(0, 0);
            return;
        }
        var currentScrollHeight = document.body.scrollHeight;
        window.scrollTo(0, currentScrollHeight);
    };
    UIManager.prototype.importFromOtherSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Import keywords from the subscription url /" + selectedURL + " ?")) {
            this.subscriptionManager.importKeywords(selectedURL);
            this.refreshPage();
        }
    };
    UIManager.prototype.linkToSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Link current subscription to: /" + selectedURL + " ?")) {
            this.subscriptionManager.linkToSubscription(selectedURL);
            this.refreshPage();
        }
    };
    UIManager.prototype.unlinkFromSub = function () {
        if (confirm("Unlink current subscription ?")) {
            this.subscriptionManager.deleteSubscription(this.subscriptionManager.getActualSubscriptionURL());
            this.refreshPage();
        }
    };
    UIManager.prototype.deleteSub = function () {
        var selectedURL = this.getSettingsControlsSelectedSubscription();
        if (selectedURL && confirm("Delete : /" + selectedURL + " ?")) {
            this.subscriptionManager.deleteSubscription(selectedURL);
            this.refreshPage();
        }
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
        return this.getHTMLId("Tab_" + FilteringType[filteringType]);
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

var HTMLSubscriptionManager = (function () {
    function HTMLSubscriptionManager(manager) {
        var _this = this;
        this.subscriptionSettings = [];
        this.configByElementType = {};
        this.manager = manager;
        this.configByElementType[HTMLElementType.SelectBox] = {
            setUpChangeCallback: function (subscriptionSetting) {
                $id(subscriptionSetting.htmlId).change(_this.getChangeCallback(subscriptionSetting));
            },
            getHTMLValue: function (subscriptionSetting) {
                return $id(subscriptionSetting.htmlId).val();
            },
            update: function (subscriptionSetting) {
                var value = _this.manager.subscription["get" + subscriptionSetting.id]();
                $id(subscriptionSetting.htmlId).val(value);
            }
        };
        this.configByElementType[HTMLElementType.CheckBox] = {
            setUpChangeCallback: function (subscriptionSetting) {
                $id(subscriptionSetting.htmlId).change(_this.getChangeCallback(subscriptionSetting));
            },
            getHTMLValue: function (subscriptionSetting) {
                return isRadioChecked($id(subscriptionSetting.htmlId));
            },
            update: function (subscriptionSetting) {
                var value = _this.manager.subscription["is" + subscriptionSetting.id]();
                setRadioChecked(subscriptionSetting.htmlId, value);
            }
        };
        this.configByElementType[HTMLElementType.NumberInput] = {
            setUpChangeCallback: function (subscriptionSetting) {
                var callback = _this.getChangeCallback(subscriptionSetting);
                $id(subscriptionSetting.htmlId)[0].oninput = function (ev) {
                    callback();
                };
            },
            getHTMLValue: function (subscriptionSetting) {
                return Number($id(subscriptionSetting.htmlId).val());
            },
            update: this.configByElementType[HTMLElementType.SelectBox].update
        };
    }
    HTMLSubscriptionManager.prototype.getChangeCallback = function (setting) {
        return function () {
            setting.manager.subscription["set" + setting.id](setting.config.getHTMLValue(setting));
            setting.manager.refreshFilteringAndSorting();
        };
    };
    HTMLSubscriptionManager.prototype.registerSettings = function (ids, type, subscriptionSettingConfig) {
        this.addSettings(ids, this.configByElementType[type], subscriptionSettingConfig);
    };
    HTMLSubscriptionManager.prototype.addSettings = function (ids, config, subscriptionSettingConfig) {
        var _this = this;
        ids.forEach(function (id) {
            var setting = new HTMLSubscriptionSetting(_this.manager, id, config, subscriptionSettingConfig);
            _this.subscriptionSettings.push(setting);
        });
    };
    HTMLSubscriptionManager.prototype.setUpCallbacks = function () {
        this.subscriptionSettings.forEach(function (subscriptionSetting) {
            subscriptionSetting.setUpCallbacks();
        });
    };
    HTMLSubscriptionManager.prototype.update = function () {
        this.subscriptionSettings.forEach(function (subscriptionSetting) {
            subscriptionSetting.update();
        });
    };
    return HTMLSubscriptionManager;
}());
var HTMLSubscriptionSetting = (function () {
    function HTMLSubscriptionSetting(manager, id, config, subscriptionSettingConfig) {
        this.manager = manager;
        this.id = id;
        this.htmlId = manager.getHTMLId(id);
        var getHTMLValue, update;
        if (subscriptionSettingConfig != null) {
            getHTMLValue = subscriptionSettingConfig.getHTMLValue;
            update = subscriptionSettingConfig.update;
        }
        getHTMLValue = getHTMLValue == null ? config.getHTMLValue : getHTMLValue;
        update = update == null ? config.update : update;
        this.config = {
            setUpChangeCallback: config.setUpChangeCallback,
            getHTMLValue: getHTMLValue,
            update: update
        };
    }
    HTMLSubscriptionSetting.prototype.update = function () {
        this.config.update(this);
    };
    HTMLSubscriptionSetting.prototype.setUpCallbacks = function () {
        this.config.setUpChangeCallback(this);
    };
    return HTMLSubscriptionSetting;
}());

var GlobalSettingsCheckBox = (function () {
    function GlobalSettingsCheckBox(id, uiManager, fullRefreshOnChange) {
        this.fullRefreshOnChange = true;
        this.id = id;
        this.uiManager = uiManager;
        this.htmlId = uiManager.getHTMLId(id);
        this.enabled = LocalPersistence.get(this.id, true);
        setRadioChecked(this.htmlId, this.enabled);
    }
    GlobalSettingsCheckBox.prototype.isEnabled = function () {
        return this.enabled;
    };
    GlobalSettingsCheckBox.prototype.setEnabled = function (enabled) {
        LocalPersistence.put(this.id, enabled);
        this.enabled = enabled;
        this.refreshUI();
    };
    GlobalSettingsCheckBox.prototype.initUI = function () {
        var this_ = this;
        $id(this.htmlId).click(function () {
            this_.setEnabled(isRadioChecked($(this)));
            this_.uiManager.refreshPage();
        });
        this.refreshUI();
    };
    GlobalSettingsCheckBox.prototype.refreshUI = function () {
        setRadioChecked(this.htmlId, this.enabled);
    };
    return GlobalSettingsCheckBox;
}());

$(document).ready(function () {
    var uiManager = new UIManager();
    var uiManagerBind = callbackBindedTo(uiManager);
    $("head").append("<style>" + templates.styleCSS + "</style>");
    NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, function () {
        console.log("Feedly page fully loaded");
        uiManager.init();
        NodeCreationObserver.onCreation(ext.articleSelector, uiManagerBind(uiManager.addArticle));
        NodeCreationObserver.onCreation(ext.magazineTopEntrySelector, uiManagerBind(uiManager.addMagazineTopEntry));
        NodeCreationObserver.onCreation(ext.sectionSelector, uiManagerBind(uiManager.addSection));
        NodeCreationObserver.onCreation(ext.subscriptionChangeSelector, uiManagerBind(uiManager.updatePage));
    }, true);
});
