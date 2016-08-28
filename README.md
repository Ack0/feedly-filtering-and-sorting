# Feedly filtering and sorting

When this script is enabled, a filter icon will appear next to the settings icon that toggles the filtering and sorting menu.

![Toggle button](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/toggle%20button.PNG)

![Menu](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu.PNG)

![Advanced settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu_advanced.PNG)

![Import settings](https://raw.githubusercontent.com/soufianesakhi/feedly-filtering-and-sorting/master/screenshots/menu_import.PNG)

## Features

- Filtering: Hide the articles that contain at least one of the filtering keywords (not applied if empty)
- Restricting: Show only articles that contain at least one of the restricting keywords (not applied if empty)
- Sorting: by popularity or by title.
- Auto load all unread articles
- Advanced controls of the recently published articles
- Pin hot articles to top.
- Import settings from other subscriptions or from global settings.

Two settings modes are available: 
- Global settings: same settings used for all subscriptions and categories.
- Subscription settings: subscription and category specific settings (the default settings values are the global settings)

## Installation

This script relies on the user scripts extensions like Greasemonkey or Tampermonkey.

After installing the appropriate user scripts extension, you can install the script from the following sites:
- https://greasyfork.org/en/scripts/20483-feedly-filtering-and-sorting
- https://openuserjs.org/scripts/soufianesakhi/Feedly_filtering_and_sorting

### Firefox

The [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) extension should be installed.

###  Google Chrome

The [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) extension should be installed.

## Dev Installation
Install NodeJS & NPM (https://nodejs.org/en/download).

```
npm install
npm install -g grunt
npm install -g typings
typings install

To build manually:
grunt

To automatically build on source code change:
grunt watch
```