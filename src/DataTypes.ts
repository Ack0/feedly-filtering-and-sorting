/// <reference path="./_references.d.ts" />

export enum SortingType {
    PopularityDesc,
    PopularityAsc,
    TitleDesc,
    TitleAsc
}

export enum FilteringType {
    RestrictedOn,
    FilteredOut
}

export function getFilteringTypes(): FilteringType[] {
    return [FilteringType.FilteredOut, FilteringType.RestrictedOn];
}

export function getFilteringTypeId(type: FilteringType): string {
    return FilteringType[type];
}
