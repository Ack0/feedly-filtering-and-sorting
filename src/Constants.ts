var cst = {
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
	"unreadCountSelector" : "#feedlyTitleBar [class*='UnreadCount']",
	"fullyLoadedArticlesSelector" : "#fullyLoadedFollowing" 
}

declare module "constants" {
    export = cst;
}
