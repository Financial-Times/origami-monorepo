# Origami Tracking component

Include in your product to send tracking requests to the [Spoor API](https://spoor-docs.herokuapp.com/).

- [Usage](#usage)
- [Events](#events)
- [Parameters](#parameters)
- [Migration Guide](#migration-guide)
- [Contact](#contact)
- [Licence](#licence)

## Usage

### Tracking without JavaScript

o-tracking does not work without JavaScript but, you can still send basic tracking requests to the Spoor API by setting a css background image url which points to the Spoor tracking pixel endpoint (`https://spoor-api.ft.com/px.gif`). Click events and other interactive events will not be tracked without JavaScript but basic page view events can be tracked.

The Spoor tracking pixel endpoint takes a `data` query parameter which is a url-encoded JSON string that represents the data to track in Spoor.

```html
<div class="o-tracking o--if-no-js" data-o-component="o-tracking">
	<div style="background: url('https://spoor-api.ft.com/px.gif?data=YOUR_URL_ENCODED_JSON_DATA_HERE');"></div>
</div>
```

For example, if you have the following data you want to track in Spoor:

```json
{
  "category": "page",
  "action": "view",
  "system": {
    "apiKey": "qUb9maKfKbtpRsdp0p2J7uWxRPGJEP",
    "source": "o-tracking",
    "version": "1.0.0"
  },
  "context": {
    "product": "ft.com",
    "content": {
      "asset_type": "page"
    }
  }
}
```
Here is the corresponding tracking pixel setup:
```html
<div class="o-tracking o--if-no-js" data-o-component="o-tracking">
    <div style="background: url('https://spoor-api.ft.com/px.gif?data=%7B%22category%22:%22page%22,%20%22action%22:%22view%22,%20%22system%22:%7B%22apiKey%22:%22qUb9maKfKbtpRsdp0p2J7uWxRPGJEP%22,%22source%22:%22o-tracking%22,%22version%22:%221.0.0%22%7D,%22context%22:%7B%22product%22:%22ft.com%22,%22content%22:%7B%22asset_type%22:%22page%22%7D%7D%7D');"></div>
</div>
```

### Tracking with JavaScript

To manually instantiate `o-tracking`, import the component and call the `init` method with configuration which is specific to your product:

If o-tracking is running on a page which has an ftsession cookie, it will automatically add that information to the data it is tracking.


``` js
import oTracking from 'o-tracking';

const config = {
    context: {
        // This value is used as a way to identify the high-level product, for example: ft.com, FT app, biz-ops etc.
        product: 'o-tracking-example',
    }
};
oTracking.init(config);
```

To track a page view for the product you call the `oTracking.page` method.
Page events automatically track the url and the referrer.
```js
const pageConfig = {
  content: {
      /*
        Asset type is meant to describe the main purpose of the page
        The value can be one of these:
        - `story` - A story or article
        - `blog` - A blog post
        - `front` - A home page or front page
        - `ad` - An advert.
        - `image` - An image
        - `interactive` - An interactive graphic
        - `report` - A special report
        - `search` - A search results page
        - `section` - A section or listing page
        - `topic` -  A topic landing page
        - `video` - A video page
        - `login` - Any login/sign-in page
        - `stream` - A stream page
        - `funnel` - Any funnel page
        - `epaper` - all epaper pages
        - `rankings` - A rankings page for schools and courses (i.e. on rankings.ft.com). Not the section's hub page
        - `markets` - Any market, bond, commoditity, stock, currency 'tearsheet' (usually has "/tearsheet/" in URL)
        - `myft` - All MyFT pages
        - `account` - All account pages
        - `membership` - All membership pages
        - `page` - anything else, not above.
    */
    asset_type: "story"
  }
};
oTracking.page(pageConfig);
```

Call the `oTracking.click.init` method to track click events. Pass the category you would like the click events to have as an argument:

- If the element being clicked is a link which goes to a page on the same domain as the current page, o-tracking will put the tracking data into a queue to send to Spoor at a later time.
- Add the attribute `data-o-tracking-skip-queue` to the element to send the data to Spoor immediately.
- O-tracking click events will also track the path from the root of the DOM tree to the element which was clicked. This is recorded in a property called `domPathTokens`.
- If the clicked element has the `data-trackable` attribute set, sibling elements will also be included within the `domPathTokens` property.
```js
// Tracking a click
const category = 'element';
oTracking.click.init(category);
```

To track when an element has come into view of the user, add the attribute `data-o-tracking-view` to the element in the page and then call the `oTracking.view.init` method:

* View events are fired for elements with the `data-o-tracking-view` attribute by default, unless `o-tracking`'s `selector` option is configured. Like click events, view events populate a `domPathTokens` property. To collect data for events, set the `category` option, or provide a callback[`getContextData`]
_Note:_ This feature requires `window.IntersectionObserver` in order to track the events
_Note:_ `getContextData` should be a function which returns `{Object}`. It accepts the viewed element as an argument

```js
const opts = {
    category: 'audio', // default: 'component'
    selector: '.o-teaser__audio', // default: '[data-o-tracking-view]'
    getContextData: (el) => {  // default: null
        return {
            componentContentId: el.getAttribute('data-id'),
            type: 'audio',
            subtype: 'podcast',
            component: 'teaser'
        };
    }
};

oTracking.view.init(opts);
```

To track a custom event call the `oTracking.event` method:
```js
const eventConfig = {
    "category": "video",
    "action": "play",
};
oTracking.event(eventConfig);
```

#### Events

Instead of calling the `page` and `event` methods `o-tracking` can be configured to fire events based on the custom DOM Events `oTracking.page` and `oTracking.event`.

##### oTracking.page

Call the `oTracking.page.init()` method to listen for `oTracking.page` events :
```js
// Tell o-tracking to listen for `oTracking.page` events
oTracking.page.init();

// Now we can send page events and o-tracking will track the data within them.
const pageData = { content: { uuid: 'abc-123', barrier: 'PREMIUM' };
document.body.dispatchEvent(new CustomEvent('oTracking.page', { detail: pageData}, bubbles: true}));
```

##### oTracking.event

To make o-tracking listen for `oTracking.event` events, you call `oTracking.event.init()`:
```js
// Tell o-tracking to listen for `oTracking.event` events
oTracking.event.init();

// Now we can send custom events and o-tracking will track the data within them.
const customData = { category: 'video', action: 'play', id: '512346789', pos: '10' };
document.body.dispatchEvent(new CustomEvent('oTracking.event', { detail: customData}, bubbles: true}));
```

### Example implementations

- [ft.com](docs/ftcom_example.md)
- [membership](docs/membership_example.md)


Events are decorated with config values you pass in via `init()` or `updateConfig()` if they are part of `context`, `user`, or `device` objects. Values passed in as `context` to individual events will override context values from init.

### Init
```js
{
    server: "...",
    context: {
        product: "..."
    },
    user: {
        ft_session: "..."
    },
    device: {
        orientation: "..."
    }
}
```

### Updating core configuration
```js
{
    device: {
        orientation: "..."
    }
}
```

### Page
```js
{
    url: "...",
    referrer: "..."
    content: {
        uuid: "...",
        hurdle: "..."
    }
    ... any other key-values ...
}
```

### Event

__Important__: To decide how to name the category and action fields, consider this sentence (square brackets denote that part is optional):

#### A user can {action} a {category}[ with/having a {context}[ to {destination}]]

For example:
* A user can view a page having a uuid.
* A user can play a video having a video ID.
* A user can share a comment having a comment ID to Facebook.
* A user can share an article having a uuid to email.
* A user can scroll a page with a asset type.
* A user can open an email.
* A user can click an element.

```js
{
    category: 'video',
    action: 'play',
    ... any other key-values ...
    id: '512346789',
    pos: '10'
}
```

[Look at all the properties](docs/event.md) available for an event.


## Migration Guide

| State | Major Version | Last Minor Release | Migration guide |
| :---: | :---: | :---: | :---: |
| ✨ active | 3 | N/A | [migrate to v3](MIGRATION.md#migrating-from-v2-to-v3) |
| ⚠ maintained | 2 | 2.0.10 | [migrate to v2](MIGRATION.md#migrating-from-v1-to-v2) |
| ╳ deprecated | 1 | 1.7.2 | N/A |

---

## Contact

If you have any questions or comments about this component, or need help using it, please either [raise an issue](https://github.com/Financial-Times/o-tracking/issues), visit [#origami-support](https://financialtimes.slack.com/messages/origami-support/) or email [Origami Support](mailto:origami-support@ft.com).

---

## Licence

This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).
