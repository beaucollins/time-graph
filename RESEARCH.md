## What is the `<Calendar>`?

The core interface provided by the Scheduler App is a React component called `<Calendar>`. It was initially created for the _Planner_ section of the app with the goal of being able to use it for the other sections as well (e.g. _Demand_, _My Availability_, _My Schedule_).

This is what it looks like in use:

__SCREENSHOT OF CALENDAR__

There's a lot of information packed in here:

- A column of labels in along the Y axis on the left next to rows that extend along the X axis.
- A header labeling the columns by hour that is fixed to the top and is always present while scrolling
- A graph with colorful roundrects spanning multiple columns and fit into rows

This UI is also interactive. Users can:

- Scroll vertically and horizontally with column and row labels remaning fixed
- Draw new colorful blocks by clicking on an empty part of the graph and dragging
- Move colorful blocks by clicking on one and dragging
- Select one or more blocks and modifying them with a keyboard

As the `<Calendar>` component exists it is highly specialized to present the information and interactions needed by the _Planner_ section. Some of these cases are not needed for the other sections, and the other sections have their own unique use cases. Can we make this easy to reuse for each case?

> React has a powerful composition model, and we recommend using composition instead of inheritance to reuse code between components.
>
> <cite>[Reactjs.org][reuse]</cite>

[reuse]: https://reactjs.org/docs/composition-vs-inheritance.html

Can we decompose the pieces of the `<Calendar>` and make them more adaptable to other use cases?

### `<Calendar>` Decomposed

The `<Calendar>` as it currently renders does encapsulate different parts of the UI.

- __COMBINED SCREENSHOT__
- __HEADER SCREENSHOT__
- __ROWS SCREENSHOT__
- __GRID SCREENSHOT__
- __BLOCKS SCREENSHOT__

Each of these layers of content are strictly visual adornments except for one: the "Blocks". If we strip all of those layers away we are left with one component that the user interacts with.

I'm going to call this piece of functionality the `<BlockGraph>`. It is the piece of the `<Calendar>` responsible for rendering those pretty RoundRects in the right place as well as reporting when the user is trying to manipulate the graph with mouse actions.

I believe the `<BlockGraph>`` already exists in the `<Calendar>` lurking in the shadows entwined in instance methods and event handlers. Can we liberate `<BlockGraph>` from the tight grasp of the `<Calendar>` and give this specter a proper life. A life with its very own `React.Component` definition and a `render` method it can be proud of? I think we can!

Let's start with an ideal API that the `<Calendar>` would use.

### The Birth of `<BlockGraph>`

Some assumptions to begin with for `<BlockGraph>`:
  - it will draw blocks in the correct position
  - it will report when a user clicks and interacts within the graph
  - it will allow for the scrolling of content that exceeds its bounds
  - it will provide space above and to the left for fixed columns and headers

#### What to draw?

How can we tell it what to draw? It needs a list of what we call _blocks_. Each of these _blocks_ has a _startTime_ and _endTime_ in seconds since the unix epoch. Time to define this in a `prop`:

```js
static propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.shape({
    startTime: PropTypes.number.isRequired,
    endTime: PropTypes.number.isRequired,
  }))
}

static defaultProps = {
  blocks: []
};

<BlockGraph
  blocks={this.state.blocksToPleaseRender}
/>
```

[Commit it](https://github.com/beaucollins/time-graph/commit/a1918d8c812720154a1a0e5c4a146d84e360d667)!

#### Where to draw?

The `x` axis of the `<BlockGraph>` is time. Right now the `<Calendar>` and _blocks_ speak in seconds since the epoch. To correctly place a block on the `x` axis it needs to know how to convert from _seconds_ to _pixels_ (**note**: pixels do not map to physical screen pixels thanks to "retina" screens, but I believe the word "pixel" works because it implies the use of a screen).

Since we can assume that the x axis is linear, a single coefficient value should be enough to convert a measurement of _seconds_ into a measurement of _pixels_. The `<BlockGraph>` does not care what this coefficient is. Honestly, it doesn't even care that it is working in seconds. It just needs to know what to multiply _startTime_ and _endTime_ by to measure their distance in pixels.

For our case _right now_ we will assume we will be given data to draw in _seconds_ so we will name our `prop` accordingly:

```js
static propTypes = {
  // add the prop!
  pixelsPerSecond: PropTypes.number.isRequired,
}
```

[Commit it!](https://github.com/beaucollins/time-graph/commit/cc437ca9f813fe7668dccaf2046f5f5507a0d026)


For the `<Demo>` component we can define a reasonable width by saying we want an hour to be 100 pixels wide. So lets hardcode some math for the `<Demo>`:

```js
const HOUR_IN_PIXELS = 100;
const SECONDS_PER_HOUR = 60 * 60;

<BlockGraph
  pixelsPerSecond={HOUR_IN_PIXELS / SECONDS_PER_HOUR}
```

[Commit it](https://github.com/beaucollins/time-graph/commit/e954553930ffd0ccec0eb28b417c649c6af2222b)

#### Too Much Time!

But wait! These _startTime_ and _endTime_ values are in absolute seconds since the unix epoch. If we're dealing in dates in the year 2018 _and beyond_ that's going to be a bajillion pixels. We should be able to give the `<BlockGraph>` a constant value to translate the `x` axis to a more reasonable space.

```js
static propTypes = {
  originSeconds: PropTypes.number.isRequired,
}
```

_A coefficient and a constant? Did we just do linear algebra?_

Now that we have a way to convert _seconds_ to _pixels_ as well as a way shift the timeline to a reasonable window of time we can write a helper instance method that will give as the screen `x` value for any `seconds` since the epoch value:

```js
covertSecondsToPixels(seconds) {
	return this.props.pixelsPerSecond * seconds;
}

convertAbsoluteSecondsToPixels(seconds) {
	// figure out
	return this.convertSecondsToPixels(seconds - this.props.originSeconds);
}
```

[Commit it!](https://github.com/beaucollins/time-graph/commit/3811063add5eba156381f75a1033ef43ae0effb3)

#### Time for the Second Dimension

The `<BlockGraph>` is super smart about converting seconds to pixels so for now the `x` axis is taken care of. But what about the `y` axis? Let's look at two different use cases we're dealing with.

- _Planner_: The y axis corresponds to a user who is associated with a block somehow.
- _My Availability_: Thy y axis corresponds to a day of the week and a block is associated with that day somehow.
- _Demand_: The y axis corresponds with a type of task that can be assigned in a block is associated with that task type somewhow.

There's a lot of ambiguity there. For each use case there is a different data type that will define where a block is vertically in the graph. Looking at the designs though it feels safe to assume that in every case rows are the same height. If `<BlockGraph>` can learn how to associate a block with a row, and know how tall a row is it can map the `y` to the correct row number and back.

These two values go together, so maybe define them together:

```
static propTypes = {
  rows: PropTypes.shape({
    getIndexForBlock: PropTypes.func.isRequired,
    height: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
  }).isRequired,
};


```
