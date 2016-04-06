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
// @require     https://openuserjs.org/src/libs/soufianesakhi/node-creation-observer.min.js
// @include     *://feedly.com/*
// @version     1.0.0
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

var cst = {
    "filterIconLink": "https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/128/empty_filter.png",
    "plusIconLink": "https://cdn0.iconfinder.com/data/icons/social-messaging-ui-color-shapes/128/add-circle-blue-128.png",
    "eraseIconLink": "https://cdn2.iconfinder.com/data/icons/large-glossy-svg-icons/512/erase_delete_remove_wipe_out-128.png",
    "closeIconLink": "https://cdn2.iconfinder.com/data/icons/social-productivity-line-art-1/128/close-cancel-128.png",
    "settingsDivPredecessorSelector": "#feedlyPageHeader",
    "settingsBtnPredecessorSelector": "#pageActionCustomize",
    "topicSelector": "#section0_column0 > div",
    "topicTitleAttribute": "data-title",
    "nbrRecommendationsSelector": ".nbrRecommendations",
    "keywordTagStyle": "vertical-align: middle; background-color: #35A5E2; border-radius: 20px; color: #FFF; cursor: pointer;",
    "iconStyle": "vertical-align: middle; height: 20px; width: 20px; cursor: pointer;",
    "settingsDivSpanStyle": "style='display: inline; vertical-align: middle;'",
    "profileNameId": "profileName",
    "profileListId": "profileList",
    "restrictedOnKeywordsId": "restrictedOnKeywords",
    "filteredOutKeywordsId": "filteredOutKeywords",
    "filteringEnabledId": "filteringEnabled",
    "restrictingEnabledId": "restrictingEnabled",
    "sortingEnabledId": "sortingEnabled",
    "sortingTypeId": "sortingType",
    "toggleSrcAttr": "toggle-src"
};

var Subscription = (function () {
    function Subscription(path) {
        this.dao = new DAO(path);
        this.restrictedOnKeywords = this.dao.deserialize(cst.restrictedOnKeywordsId, []);
        this.filteredOutKeywords = this.dao.deserialize(cst.filteredOutKeywordsId, []);
        this.filteringEnabled = this.dao.getValue(cst.filteringEnabledId, false);
        this.restrictingEnabled = this.dao.getValue(cst.restrictingEnabledId, false);
        this.sortingEnabled = this.dao.getValue(cst.sortingEnabledId, false);
        this.sortingType = this.dao.getValue(cst.sortingTypeId, 'nbRecommendationsDesc');
        this.keywords = {};
        this.keywords[cst.restrictedOnKeywordsId] = {
            list: this.restrictedOnKeywords,
            plusBtnId: "AddRestrictedOnKeyword",
            eraseBtnId: "DeleteAllRestrictedOnKeyword"
        };
        this.keywords[cst.filteredOutKeywordsId] = {
            list: this.filteredOutKeywords,
            plusBtnId: "AddFilteredOutKeyword",
            eraseBtnId: "DeleteAllFilteredOutKeyword"
        };
    }
    Subscription.prototype.getDAO = function () {
        return this.dao;
    };
    return Subscription;
}());

var TopicManager = (function () {
    function TopicManager(subscription) {
        this.titles = [];
        this.nbrRecommendationsArray = [];
        this.subscription = subscription;
    }
    TopicManager.prototype.resetSorting = function () {
        this.titles = [];
        this.nbrRecommendationsArray = [];
    };
    TopicManager.prototype.refreshKeywordList = function (keywordList, keywordListId) {
        var keywordListHtml = this.getKeywordList(keywordList, keywordListId);
        this.$id(keywordListId).replaceWith(keywordListHtml);
        this.refreshTopics();
        this.subscription.getDAO().serialize(keywordListId, keywordList);
        this.setKeywordListEvents(keywordList, keywordListId);
    };
    TopicManager.prototype.$id = function (id) {
        return $('#' + id);
    };
    TopicManager.prototype.getId = function (keywordListId, keyword) {
        return keywordListId + "_" + keyword;
    };
    TopicManager.prototype.getKeywordList = function (keywordList, keywordListId) {
        var result = "<span id=" + keywordListId + ">";
        // keyword list
        for (var i = 0; i < keywordList.length; i++) {
            var keyword = keywordList[i];
            var keywordId = this.getId(keywordListId, keyword);
            result += '<button id="' + keywordId + '" type="button" style="' + cst.keywordTagStyle + '">' + keyword + '</button>';
        }
        // plus button
        var plusBtnId = this.subscription.keywords[keywordListId].plusBtnId;
        result += '<span id="' + plusBtnId + '" > <img src="' + cst.plusIconLink + '" style="' + cst.iconStyle + '" /></span>';
        // Erase button
        var eraseBtnId = this.subscription.keywords[keywordListId].eraseBtnId;
        result += '<span id="' + eraseBtnId + '" > <img src="' + cst.eraseIconLink + '" style="' + cst.iconStyle + '" /></span>';
        result += "</span>";
        return result;
    };
    TopicManager.prototype.setKeywordListEvents = function (keywordList, keywordListId) {
        // Plus button event
        var plusBtnId = this.subscription.keywords[keywordListId].plusBtnId;
        this.$id(plusBtnId).click(function () {
            var keyword = prompt("Add keyword", "");
            if (keyword !== null) {
                keywordList.push(keyword);
                this.refreshKeywordList(keywordList, keywordListId);
            }
        });
        // Erase button event
        var eraseBtnId = this.subscription.keywords[keywordListId].eraseBtnId;
        this.$id(eraseBtnId).click(function () {
            if (confirm("Erase all the keyword of this list ?")) {
                this.keywords[keywordListId].list.length = 0;
                this.refreshKeywordList(keywordList, keywordListId);
            }
        });
        // Keyword buttons events
        for (var i = 0; i < keywordList.length; i++) {
            var keywordId = this.getId(keywordListId, keywordList[i]);
            this.$id(keywordId).click(function () {
                var keyword = $(this).text();
                if (confirm("Delete the keyword ?")) {
                    var index = keywordList.indexOf(keyword);
                    if (index > -1) {
                        keywordList.splice(index, 1);
                        this.refreshKeywordList(keywordList, keywordListId);
                    }
                }
            });
        }
    };
    TopicManager.prototype.refreshTopics = function () {
        this.resetSorting();
        $(cst.topicSelector).each(function () {
            this.refreshTopic($(this));
        });
    };
    TopicManager.prototype.refreshTopic = function (topic) {
        var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
        if (this.subscription.filteringEnabled || this.subscription.restrictingEnabled) {
            var keep = false;
            var restrictedCount = this.subscription.restrictedOnKeywords.length;
            if (this.subscription.restrictingEnabled && restrictedCount > 0) {
                keep = true;
                for (var i = 0; i < restrictedCount && keep; i++) {
                    if (title.indexOf(this.subscription.restrictedOnKeywords[i].toLowerCase()) != -1) {
                        keep = false;
                    }
                }
            }
            if (this.subscription.filteringEnabled) {
                for (var i = 0; i < this.subscription.filteredOutKeywords.length && !keep; i++) {
                    if (title.indexOf(this.subscription.filteredOutKeywords[i].toLowerCase()) != -1) {
                        keep = true;
                    }
                }
            }
            if (keep) {
                topic.css("display", "none");
            }
            else {
                topic.css("display", "");
            }
        }
        else {
            topic.css("display", "");
        }
        if (this.subscription.sortingEnabled) {
            this.sortTopic(topic);
        }
    };
    TopicManager.prototype.sortTopic = function (topic) {
        if (this.subscription.sortingType == 'titleAsc' || this.subscription.sortingType == 'titleDesc') {
            var title = topic.attr(cst.topicTitleAttribute).toLowerCase();
            this.titles.push(title);
            this.titles.sort();
            if (this.subscription.sortingType == 'titleDesc') {
                this.titles.reverse();
            }
            var index = jQuery.inArray(title, this.titles);
            topic.insertIndex(index);
        }
        else if (this.subscription.sortingType == 'nbRecommendationsAsc' || this.subscription.sortingType == 'nbRecommendationsDesc') {
            var nbrRecommendationsStr = topic.find(cst.nbrRecommendationsSelector).text().trim();
            nbrRecommendationsStr = nbrRecommendationsStr.replace("+", "");
            if (nbrRecommendationsStr.indexOf("K") > -1) {
                nbrRecommendationsStr = nbrRecommendationsStr.replace("K", "");
                nbrRecommendationsStr += "000";
            }
            var nbrRecommendations = Number(nbrRecommendationsStr);
            if (nbrRecommendations < 100) {
                nbrRecommendations = 1;
            }
            this.nbrRecommendationsArray.push(nbrRecommendations);
            this.nbrRecommendationsArray.sort(function (a, b) {
                var i = (this.subscription.sortingType == 'nbRecommendationsAsc' ? -1 : 1);
                return (b - a) * i;
            });
            index = this.nbrRecommendationsArray.lastIndexOf(nbrRecommendations);
            topic.insertIndex(index);
        }
    };
    return TopicManager;
}());

var DAO = (function () {
    function DAO(path) {
        this.path = path;
    }
    DAO.prototype.deserializeDirectly = function (id, def) {
        return eval(GM_getValue(id, (def || '({})')));
    };
    DAO.prototype.serializeDirectly = function (id, val) {
        GM_setValue(id, uneval(val));
    };
    DAO.prototype.deserialize = function (id, def) {
        return eval(this.getValue(id, (def || '({})')));
    };
    DAO.prototype.serialize = function (id, val) {
        this.setValue(id, uneval(val));
    };
    DAO.prototype.getValue = function (id, value) {
        return GM_getValue(id, value);
    };
    DAO.prototype.setValue = function (id, value) {
        GM_setValue(id, value);
    };
    return DAO;
}());

var CallbackFactory = (function () {
    function CallbackFactory(owner) {
        this.owner = owner;
    }
    CallbackFactory.prototype.get = function (method) {
        return function () {
            method.apply(this.owner, $(this));
        };
    };
    return CallbackFactory;
}());

var subscription = new Subscription("");
var topicManager = new TopicManager(subscription);
var topicCF = new CallbackFactory(topicManager);
$.fn.insertIndex = function (i) {
    // The element we want to swap with
    var $target = this.parent().children().eq(i);
    // Determine the direction of the appended index so we know what side to place it on
    if (this.index() > i) {
        $target.before(this);
    }
    else {
        $target.after(this);
    }
    return this;
};
$(document).ready(function () {
    var enableFilteringCheckId = "enableFiltering";
    var enableRestrictingCheckId = "enableRestricting";
    var settingsDivId = "settingsDiv";
    var settingsBtnId = "settingsBtn";
    // Adding filtering configuration
    NodeCreationObserver.onCreation(cst.settingsDivPredecessorSelector, function () {
        console.log("Feedly page fully loaded");
        // Settings Button
        var settingsBtn = '<img id="' + settingsBtnId + '" class="pageAction requiresLogin" style="display: inline; width: 24px; height: 24px;" src="' + cst.filterIconLink + '" ' + cst.toggleSrcAttr + '="' + cst.closeIconLink + '" alt="icon"/>';
        $(cst.settingsBtnPredecessorSelector).after(settingsBtn);
        // Settings Div
        var settingsDiv = '<div id="' + settingsDivId + '" >' +
            // Checkbox to enable filtering
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtering enabled</span>' +
            '<input id="' + enableFilteringCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +
            // Checkbox to enable restricting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricting enabled</span>' +
            '<input id="' + enableRestrictingCheckId + '" type="checkbox" style="vertical-align: middle;">' +
            '</div>' +
            // Checkbox to enable sorting
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Sorting enabled</span>' +
            '<input id="' + cst.sortingEnabledId + '" type="checkbox" style="vertical-align: middle;">' +
            '<select id=' + cst.sortingTypeId + '>' +
            '<option value="nbRecommendationsDesc">Sort by number of recommendations (highest to lowest)</option>' +
            '<option value="titleAsc">Sort by title (a -> z)</option>' +
            '<option value="nbRecommendationsAsc">Sort by number of recommendations (lowest to highest)</option>' +
            '<option value="titleDesc">Sort by title (z -> a)</option>' +
            '</select>' +
            '</div>' +
            // Restricted on keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Restricted on keyword list: </span>' +
            topicManager.getKeywordList(subscription.restrictedOnKeywords, cst.restrictedOnKeywordsId) +
            '</div>' +
            // Filtered out keyword list
            '<div>' +
            '<span ' + cst.settingsDivSpanStyle + '>Filtered out keyword list: </span>' +
            topicManager.getKeywordList(subscription.filteredOutKeywords, cst.filteredOutKeywordsId) +
            '</div>' +
            '</div>';
        $(this).after(settingsDiv);
        // Set checkbox & select boxes correct state
        var filteringCheck = topicManager.$id(enableFilteringCheckId);
        filteringCheck.prop('checked', subscription.filteringEnabled);
        var restrictingCheck = topicManager.$id(enableRestrictingCheckId);
        restrictingCheck.prop('checked', subscription.restrictingEnabled);
        var sortingCheck = topicManager.$id(cst.sortingEnabledId);
        sortingCheck.prop('checked', subscription.sortingEnabled);
        var sortingTypeSelect = topicManager.$id(cst.sortingTypeId);
        sortingTypeSelect.val(subscription.sortingType);
        var dao = subscription.getDAO();
        // Checkbox & select boxes events
        filteringCheck.change(function () {
            subscription.filteringEnabled = $(this).is(':checked');
            dao.setValue(cst.filteringEnabledId, subscription.filteringEnabled);
            topicManager.refreshTopics();
        });
        restrictingCheck.change(function () {
            subscription.restrictingEnabled = $(this).is(':checked');
            dao.setValue(cst.restrictingEnabledId, subscription.restrictingEnabled);
            topicManager.refreshTopics();
        });
        sortingCheck.change(function () {
            subscription.sortingEnabled = $(this).is(':checked');
            dao.setValue(cst.sortingEnabledId, subscription.sortingEnabled);
            topicManager.refreshTopics();
        });
        sortingTypeSelect.change(function () {
            subscription.sortingType = sortingTypeSelect.val();
            dao.setValue(cst.sortingTypeId, subscription.sortingType);
            topicManager.refreshTopics();
        });
        // Setting button events
        topicManager.$id(settingsBtnId).click(function () {
            var _this = $(this);
            var current = _this.attr("src");
            var swap = _this.attr(cst.toggleSrcAttr);
            _this.attr('src', swap).attr(cst.toggleSrcAttr, current);
            topicManager.$id(settingsDivId).toggle();
        });
        // Settings Div Style
        topicManager.$id(settingsDivId).css("display", "none")
            .css('margin', '25px')
            .css('border-radius', '25px')
            .css('border', '2px solid #336699')
            .css('background', '#E0F5FF')
            .css('padding', '20px');
        // Events on keyword lists
        topicManager.setKeywordListEvents(subscription.restrictedOnKeywords, cst.restrictedOnKeywordsId);
        topicManager.setKeywordListEvents(subscription.filteredOutKeywords, cst.filteredOutKeywordsId);
    }, true);
    // Reset titles array when changing page
    NodeCreationObserver.onCreation(".feedUnreadCountHint, .categoryUnreadCountHint", function () { topicManager.resetSorting(); });
    // New topics listener
    NodeCreationObserver.onCreation(cst.topicSelector, function () { topicManager.refreshTopic($(this)); });
});
