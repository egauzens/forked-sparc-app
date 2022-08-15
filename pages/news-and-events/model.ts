import { Asset, ContentfulClientApi, Entry, EntryCollection } from 'contentful';
import { Route } from 'vue-router';
import { sub } from 'date-fns'

import { Breadcrumb } from '@/components/Breadcrumb/model.ts';
import { searchQueryReplacements } from '../data/utils';

const replaceTerms = (terms?: string) => {
  let result = terms
  if (result) {
    Object.entries(searchQueryReplacements).forEach(([term, replacement]) => result = result?.replace(term, replacement))
  }
  return result
}

export const fetchData = async (client: ContentfulClientApi, terms?: string, limit?: number) : Promise<AsyncData> => {

  const query = replaceTerms(terms)

  try {
    const todaysDate = new Date()

    const upcomingEvents = await client.getEntries<EventsEntry>({
      content_type: process.env.ctf_event_id,
      order: 'fields.startDate',
      'fields.startDate[gte]': todaysDate.toISOString(),
      query,
      limit
    })

    const pastEvents = await client.getEntries<EventsEntry>({
      content_type: process.env.ctf_event_id,
      order: '-fields.startDate',
      'fields.startDate[lt]': todaysDate.toISOString(),
      'fields.startDate[gte]': sub(todaysDate, { years: 2 }).toISOString(),
      query,
      limit
    })

    const news = await fetchNews(client, query, undefined, undefined, limit)

    const page = await client.getEntry<PageData>(process.env.ctf_news_and_events_page_id ?? '')

    const stories = await client.getEntries<StoryEntry>({
      content_type: 'successStoryDisplay',
      order: '-fields.publishedDate',
    })

    return {
      upcomingEvents,
      pastEvents,
      news,
      page,
      stories
    }
  } catch (e) {
    console.error(e)
    return {
      upcomingEvents: {} as unknown as EventsCollection,
      pastEvents: {} as unknown as EventsCollection,
      news: {} as unknown as NewsCollection,
      page: {} as unknown as PageEntry,
      stories: {} as unknown as StoryCollection
    }
  }
}

export const fetchEvents = async (client: ContentfulClientApi, terms?: string, eventStartLessThanDate?: string, eventStartGreaterThanOrEqualToDate?: string, eventTypes?: Array<string>, limit?: number, skip?: number) : Promise<EventsCollection> => {

  const query = replaceTerms(terms)

  try {
    return await client.getEntries<EventsEntry>({
      content_type: process.env.ctf_event_id,
      order: '-fields.startDate',
      query,
      limit,
      skip,
      'fields.startDate[lt]': eventStartLessThanDate,
      'fields.startDate[gte]': eventStartGreaterThanOrEqualToDate,
      'fields.eventType[in]': eventTypes
    })
  } catch (e) {
    console.error(e)
    return {} as unknown as EventsCollection
  }
}

export const fetchNews = async (client: ContentfulClientApi, terms?: string, publishedLessThanDate?: string, publishedGreaterThanOrEqualToDate?: string, limit?: number, skip?: number) : Promise<NewsCollection> => {

  const query = replaceTerms(terms)

  try {
    return await client.getEntries<NewsEntry>({
      content_type: process.env.ctf_news_id,
      order: '-fields.publishedDate',
      query,
      limit,
      skip,
      'fields.publishedDate[lt]': publishedLessThanDate,
      'fields.publishedDate[gte]': publishedGreaterThanOrEqualToDate,
    })
  } catch (e) {
    console.error(e)
    return {} as unknown as NewsCollection
  }
}

export type AsyncData = Pick<Data, "upcomingEvents" | "pastEvents" | "news" | "page" | "stories">

export interface PageData {
  featuredEvent?: EventsEntry;
  page_title?: string;
  heroCopy?: string;
  heroImage?: Asset;
}

export type PageEntry = Entry<PageData>

export interface Event {
  endDate?: string;
  eventType?: string;
  image?: Asset;
  location?: string;
  startDate?: string;
  summary?: string;
  title?: string;
  url?: string;
}

export interface SuccessStory {
  title?: string;
  youtubeUrl?: string;
}

export type StoryEntry = Entry<SuccessStory>
export type StoryCollection = EntryCollection<StoryEntry>

export type EventsEntry = Entry<Event>
export type EventsCollection = EntryCollection<EventsEntry>

export interface News {
  publishedDate?: string;
  summary?: string;
  title?: string;
  url?: string
}

export type NewsEntry = Entry<News>
export type NewsCollection = EntryCollection<NewsEntry>

export interface Tab {
  label: string;
  type: string;
}

export interface Data {
  title: string;
  breadcrumb: Breadcrumb[];
  activeTab: string;
  eventsTabs: Tab[];
  upcomingEvents: EventsCollection;
  pastEvents: EventsCollection;
  news: NewsCollection;
  page: PageEntry;
  stories: StoryCollection
}

export interface Computed {
  featuredEvent: EventsEntry,
  shownStories: StoryCollection
}
export interface Methods {
  getAllNews: (this: NewsAndEventsComponent) => void;
}
export interface NewsData {
  breadcrumb: Breadcrumb[]
}
export interface NewsComputed {
  curSearchPage: number,
  publishedLessThanDate?: string
  publishedGreaterThanOrEqualToDate?: string
}
export interface NewsMethods {
  onPaginationPageChange: (page: number) => void
  onPaginationLimitChange: (limit: string) => void
}
export interface EventsData {
  breadcrumb: Breadcrumb[]
}
export interface EventsComputed {
  curSearchPage: number,
  startLessThanDate?: string 
  startGreaterThanOrEqualToDate?: string
  eventTypes?: Array<string>
}
export interface EventsMethods {
  onPaginationPageChange: (page: number) => void
  onPaginationLimitChange: (limit: string) => void
}

export type NewsAndEventsComponent = Data & Computed & Methods & { $route: Route }
export type NewsPage = NewsData & NewsComputed & NewsMethods & { $route: Route }
export type EventsPage = EventsData & EventsComputed & EventsMethods & { $route: Route }
