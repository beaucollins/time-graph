# BlockGraph

`<BlockGraph>` is a two dimensional graphing component. On the `x` of the graph is linear time, the `y` axis is definable by the user. The `<BlockGraph>` accepts parameters that allow the user to define the scale of time (e.g. how wide a second is in pixels) as well as the origin (what `x=0` equals in time).
  
In linear algebra terms these are the coefficient and contant of linear function that `<BlockGraph>` will use to compute screen positions.
  
For all of our use cases the rows in our UIs all have a constant height. For every graph, every row in that graph will be the same height as the other rows in the graph. Using this assumption we can define the `y` axis by providing a row's height and the number of rows.

## Ideal Functionalty

The `<BlockGraph>` will:

Display:

 - Efficiently render all drawable data provided to it.
 - Create, own, and control the scrollable area the graph lives in.
 - Allow the parent component to decorate the graph with label/columns/rows/grids.

Interactions:

- Provide a configurable set of events/actions that allow users to interact with the data on the graph.
- Allow the parent component to stay in its domain of data (time and rows) while managing everything related to screen dimensions.
- Allow the parent component to define how those actions maniplate the content that is rendered.

## Render Configuration

To tell `BlockGraph` how to convert a screen's `x` coordinate to a second and back the user must provide these props:
- `pixelsPerSecond` - `number.isRequired` - how many pixels a second will occupy on screen
- `graphTimeSpan` - `{startTime: number.isRequired, endTime: number.isRequired}` - the smallest time and largest time the graph will be rendering (how wide the graph is and it's origin can be determined by these values)
- `rowHeight` - `number.isRequired` - how tall a row is
- `rowCount` - `number.isRequired` - how many rows there are

```js

import BlockGraph from 'block-graph';

// in your component
render() {
  return (
    <div>
      <div>{this.renderMenu()}</div>
      <div>
        <BlockGraph
          pixelsPerSecond={ 100 / SECONDS_PER_HOUR }
          graphTimeSpan={ startTime: 0, endTime: SECONDS_PER_DAY }
          rowCount={200}
          rowHeight={40}
          />
      </div>
    </div>
  )
}

```

This is enough information for the block graph to know:

1) How big it will have to make the graph to show all the content (the scrollable size)
2) How to convert the screen's x and y pixels into seconds and row indices.
3) How to convert row indices and seconds into x/y coordinates.

## Drawing Stuff

There are two different types of content to draw: rows and blocks.

- _block_: A _block_ can exist anywhere on a graph depending on what time the block occurs at and which index the block is associated with. In terms of a spreadsheet this is a cell.
- _row_: A _row_ exists on the full width of the graph but only exists in a specifi space vertically. In terms of a speadsheet this is a row.

### Drawing Blocks

One example of a _block_ is in the Planner section of the app. In the Planner, the y axis is a list of people. A _block_ in the planner represents a task assigned to a person. The _block_ has a `startTime` and an `endTime`. These properties can be used to tell the `<BlockGraph>` where a `block` goes on the `x` axis. A _block_ in the Planner will also have a `userId` of some kind associating it with a user. The `<BlockGraph>` will need to know how to associate the `userId` to an index in the list of users.

Building on the code sample above, we need to give a `<BlockGraph>` the blocks we want it to daw, we're going to assume these blocks are kept in the parents component's state:
  
```js
// in the render function of the parent component
<BlockGraph
  // other props truncated for legibility
  blocks={this.state.blocks}
  />
```

We want the `<BlockGraph>` to be as dumb as possible when it comes to what a `block` is. So instead of `<BlockGraph>` assuming the shape of a _block_ we should teach a `<BlockGraph>` how to convert one of our blocks into something it can graph. Assuming our `state.blocks` is an array of `Array<{startTime: number, endTime: number, staffId: string}>` we will need to give the `BlockGraph` a function that converts our `block` into the information it needs to draw it:
  
```js
<BlockGraph
  blocks={this.state.blocks}
  getBlockTimeSpanIndex={this.getBlockTimeSpanIndex}
/>

getBlockTimeSpanIndex = block => {
  return ({
    startTime: block.startTime,
    endTime: block.endTime,
    rowIndex: this.getUserRowIndex(block.userId)
  })
}
```

A `<BlockGraph>` at this point can now calculate where any block goes. But what does a block look like? What should it render? This is something else the `<BlockGraph>` should make no assumptions about, the parent component needs to teach it how to render a block as well. Since we've already taught it where a _block_ should be placed, when the parent component teaches the `<BlockGraph>` how to render a block, it will also be given the exact dimensions for rendering it.


```js

/**
 * @param {Object} block - the block in this.state.blocks to render
 * @param {Rectangle} rect - the position and dimensions for the block
 * @returns {React.Component} the component to render for the block
 */
renderBlock => (block, rect) => {
  // rect contains top, left, width, height, we can now render a component that's absolutely
  // position with those values
  return (<MyAwesomeBlock key={block.uid} {...rect} block={block}>)
}

<BlockGraph
  renderBlock={this.renderBlock}
 />
```

#### Block Drawing Performance Sidenote

In the previous example the `<BlockGraph>` will render an updated `<MyAwesomeBlock>` for every _block_ in `state.blocks` every time the `<BlockGraph>` updates.

The first easy performance win is to make sure `<MyAwesomeBlock>` instances use `componentShouldUpdate` or inherit from `React.PureComponent` and _only_ update when absolutely necessary. A `<BlockGraph>` configured this way can get by fine with 600 blocks.

### Drawing Rows

Rows are different to blocks in that they exist across the whole x axis. In fact, the only important things about a row is giving visual horizontal context to a block on the graph. So the only important piece of information for a row is its row index. Based on that, the `<BlockGraph>` can calculate the dimensions for any given row.

In the end the row drawing interface is very similar to the block drawing interface: give the `<BlockGraph>` some rows and then tell it how to render a row:

```js
/**
 * @param {Object} user - the user from this.state.users
 * @param {Object} rowRect - the rectangle for the row on the screen
 */
renderRow = (user, rowRect) => {
  return <MyAwesomeUserRow key={user.id} user={user} {...rowRect} />;
}

<BlockGraph
  rows={this.state.users}
  renderRow={this.renderRow}
 />
```

#### Row Drawing Performance Sidenote

Similarly to blocks, the `<BlockGraph>` can efficiently draw hundreds of rows if the row's component uses `shouldComponentUpdate` or inherits from `React.PureCompenent` and only updates the component when needed.


### Interactions

Up to this point we have been defining everything a `<BlockGraph>` will need to know in order to draw blocks and rows to the screen. The other piece of the puzzle is defining how to react to what the user might be trying to do to the block graph through mouse and keybord events.

At the lowest level, the `<BlockGraph>` will need to listen to `mousedown`, `mouseup`, `mousemove` DOM events. It _could_ just let the parent define these and pass them to props and make the parent do everything. Howewer, the `<BlockGraph>` has been given some interesting abilities now that it can convert between block data and the screen.

#### Events: Context Switching from Screen to Graph and Back

Let's say that tha `<BlockGraph>` creates a `<div>` that has `overflow: auto, position: relative` and then all of the blocks within it are `position: absolute` with the screen rects that it gives the parent in `renderBlock`. If it provides an `onMouseMove` prop to the scrollable block it can use it's conversion abilities to pass along more context to the parent.

```js
// in <BlockGraph>

onMouseDown = event => {
  const pointInPage = {x: event.pageX, y: event.pageY };
  const pointInGraph = this.convertPagePointToGraphPoint(pointInPage);
  // now we can convert the x to seconds and the y to the matching row's index
  const timeIndex = {
    seconds: this.convertXToSecond(pointInGraph.x),
    rowIndex: this.convertYToRowIndex(pointInGraph.y),
  };
  // the parent can have a smarter onMouseDown with more context
  this.props.onMouseDown(event, pointInGraph, timeIndex);
};

convertPagePointToGraphPoint({ x, y }) {
  // get the bounding rect for the scrolling container
  // this is where the DOM node on the page relative to the top left of the viewport
  // this takes into account all potentially scrolled containers in all of the
  // node's parents
  const rect = this.scrollContainer.current.getBoundingClientRect();
  // do some scroll offset calculations and we can know the exact x, y this event
  // happened to on the graph
  return { x: x - rect.x, y: y - rect.y };
}

render() {
  const style = { position: 'relative', overflow: 'auto' };
  return (
    <div
      ref={this.scrollContainer}
      style={style}
      onMouseDown={this.onMouseDown}
      >
      {this.renderBlocks()}
    </div>
  );
}
```

Providing the additional context to the parent will allow the parent to ignore event `x` and `y` coordinates and stay in the `seconds` and `rowIndex` domain for all `<BlockGraph>` events. All context switching happens inside `<BlockGraph>`.

In the parent component's `onMouseDown` callback, it will be told not only the `x` and `y` on the graph where the event happenned but also the `seconds` and `rowIndex`.

```js
// in parent component
onGraphMouseDown = (event, graphCoordinate, graphTimeAndRow) => {
  const { seconds, rowIndex } = graphTimeAndRow;
  const user = this.getUserForRow(rowIndex);
  // the user pressed a mouse button down maybe find the relevant block that matches
  // that time and user?
}

render() {
  return (
    // truncated for legibility
    <BlockGraph
      onMouseDown={onGraphMouseDown}
      onMouseMove={onGraphMouseMove}
      onMouseUp={onGraphMouseUp}
      onClick={onGraphClick}
      // etc
    />
  );
}
```

The `<Calendar>` component's event handlers as they exists could be simplified if they are given `seconds` and `rowIndex` already instead of calculating itself. But this doesn't necessarily help with the more complex user interactions we need to support like "drag and drop" and drawing over multiple rows which react to a combination on events that happen in a particular order.

For instance, a multiline drawing would look like:

1. `onMouseDown` - store where the mouse down occured and that the mouse is down
2. `onMouseMove` - calculate how far the mouse moved, if far enough, determine which rows and timespan the move covers and generate resulting blocks:
  - make sure overlapping blocks are merged and split
  - update the `BlockGraph` to show the new block state
  - keep the old blocks around because the user can keep moving the mouse the same calculations need to happen again
3. `onMouseUp` - indicate that the latest data manipulation from step 2 should be "committed" somehow

A similar but slightly different thing will happen if the user starts the `onMouseDown` on a _block_ in the graph. And there are three different cases depending on where inside the block the user clicked:

1. On the left edge, resize the block's `startTime`
2. On the right edge, resize the block's `endTime`
3. Anywhere else, move the block event by row
  a. If a key modifier is down allow copying of the block

The number of cases start to get a bit complex and this doesn't cover all of them. Can we seperate some concerns to help organize what the user is doing and how that action manipulates the data within the `<BlockGraph>`? Can we keep track if what is _temporary_ while the user is performing their mouse gestures?

#### Gestures: Building Complex Interactions out of Events

If you take a look at the more complex mouse interactions, they generally follow a pattern:

1. `mousedown`: Store some event data that will be used in a `mousemove` to see if the `mousemove` is significant.
2. `mousemove`: compare some new event data with `mousedown` data, potentially produce new graph data.
3. `keydown`: Is it an "Alt" key? Potentially produce new graph data.
3. `mouseup`: Compare some new event data with stored data, tell something that the new graph state should be saved.


 In each step above an event comes in, event state is examined and compared to previous events, and maybe that combination of events produces new `<BlockGraph>` data. So two steps per event:

1. Detect some kind of combination of events that have occurred.
2. Produce new `<BlockGraph>` state

Let's tackle the first step. In each case, we receive an event (the user moved the mouse), compare what the event means in the context of the events that preceded it (was the mouse already down?) and produce updated mouse event state. Let's call the events that come in from the `<BlockGraph>` a `BlockGraphEvent` and a combination of events a `Gesture`.

So in pseudo-code it kind of looks like:

```js
(BlockGraphEvent, Gesture) => Gesture
```

So if we can hook up the `<BlockGraph>` component to feed all of its events into a function that takes `(BlockGraphEvent)` and a `Gesture` and gives an updated gesture. It can keep track if the `Gesture` in its own state. This `Gesture` stuff seems related to the `<BlockGraph>` but doesn't necessarily need to live inside the `<BlockGraph>`'s implementation.

Let's try layering the functionality in with a higher order compenent. Welcome to `withGestures`.

```js
import BlockGraph from './index';

/**
 * @param {Function} recognizer - transforms a gesture into a new gesture
 * @returns {Component} component with gesture recognizers
 */
export default function withGestures(recognizer = () => null) {
	class WithGestures extends Component {

		handleGraphEvent = (type, parentHandler) => (event, graphData) => {
			parentHandler(event, graphData);
			this.setState({ gesture: recognizer({ type, event, graphData }, this.state.gesture) });
		}

		constructor(props) {
			super(props);
			this.state = {};
			this.graphRef = createRef();

      this.handleGraphClick = this.handleGraveEvent('click', this.props.onGraphClick);
      this.handleGraphMouseDown = this.handleGraveEvent('mousedown', this.props.onGraphMouseDown);
    }

		componentDidUpdate(_, prevState) {
			if (prevState.gesture !== this.state.gesture) {
				const { applyGesture, blocks } = this.props;
				this.props.onGestureChange(this.state.gesture, prevState.gesture, (gesture) => {
					return applyGesture(gesture, blocks);
				});
			}
		}
  
    render() {
      const updatedDate = this.state.
      return <BlockGraph /* truncated for legibility */ />
    }
	}
	WithGestures.displayName = `WithGestures(${getDisplayName(BlockGraph)})`;
	return WithGestures;
}

```

Some things to point out:

1. `recognizer` is the function we describe previosly: `(blockGraphEvent, gesture) => gesture`
   - by default we don't recognize any events, it always returns `null`
2. `handleGraphEvent` is a helper that creates event handlers that work with `<BlockGraph>`. There would be one for each event that `<BlockGraph>` has on its props.
3. For every event that happens, the `recognizer` is called and is given the opportunity to produce a `Gesture`. So far what a gesture is has been determined. It will be up to the parent component to provide this information. The updated `Gesture` is stored in component state.

Here's how it looks in action from the parent component's perspective:

```js
import withGestures from 'block-graph/with-gestures';

// graphEvent.graphContext has the graph x/y as well as time and row index
// it also knows if the event happenned on any blocks and provides the blocks
const recognizer = (graphEvent, gesture = {type: 'idle'}) => {
  switch (graphEvent.type) {
    case 'mousedown':
      if (graphEvent.block) {
        // the user touched down on a block, start a move gesture
        return { type: 'move-block', block: graphEvent.block, origin: graphEvent.graphContext };
      } else {
        // the user touched down on the graph but not on a block, start
        // a multi-row drawing gesture 
        return { type: 'multiline', origin: graphEvent.graphContext };
      }
    case 'mousemove':
      if (gesture && (gesture.type === 'multiline' || gesture.type === 'move-block')) {
        return { ... gesture, destination: gesture.graphContext };
      }
      break;
    case 'mouseup':
      if (gesture && (gesture.type === 'multiline' || gesture.type === 'move-block')) {
        return { type: 'commit', gesture }
      }
      break;
  }
  return gesture;
};

const BlockGraph = withGestures(recognizer);

class Planner extends React.Component {
  render() {
    return (<BlockGraph
        // same configuration data
      />);
  }
}

```
In the previous example we created a gesture recognizer that figures out if the user is doing a "move a block" vs "draw across multiple rows" gesture. The recognizer's job is to compare a `graphEvent` with the current occuring `gesture` and determine the new gesture that results.

Notice that the first thing the recognizer does is `switch` on the `graphEvent.type` value. We can take a page out of `redux`'s use and create a wrapper function that allows us to provide an object with keys that match event types mapped to functions that handle that specific event:

```js
const mousedownRecognizer = (mouseDownGraphEvent, gesture) => {
      if (graphEvent.block) {
        // the user touched down on a block, start a move gesture
        return { type: 'move-block', block: graphEvent.block, origin: graphEvent.graphContext };
      } else {
        // the user touched down on the graph but not on a block, start
        // a multi-row drawing gesture 
        return { type: 'multiline', origin: graphEvent.graphContext };
      }
}

// other recognizers not defined for brevity

const recognizer = onEventType({
  'mousedown': mousedownRecognizer,
  'mouseup': mouseupRecognizer,
  'mousemove': mousemoveRecognizer,
})

const BlockGraph = withGestures(recognizer);
```

Each step of the recoginzer can be highly focused on turning an event and existing gesture into a new gesture. Even more of a bonus: these are _very easily_ testable:

```js
  it( 'should detect a multiline gesture', () => {
    const gestureA = recognizer(mockMouseDownEvent, null);
    const gestureB = recognizer(mockMouseMoveEvent, gesture1);
    const gestureC = recognizer(mockMouseMoveEvent, gesture3);
    assertEqual(gestureA.type, 'multiline');
  } );
```

Now we have a clear way to define how different combinations of events within `<BlockGraph>` can be modeled to produce gestures. Most instances of the `<BlockGraph>` will more than likely use the same gestures. But what those gestures do to the block data may be different.

The next step is teaching the `<BlockGraph>` how a gesture might manipulate the data it is displaying.

### Applying Gestures to Data

The `withGestures` higher-order component wrapper gives us a way to teach the `<BlockGraph>` about gestures. The next step is teaching the `<BlockGraph>` how those gestures change the blocks that the `<BlockGraph>` is displaying.

The `withGestures` wrapper adds a new prop to the `<BlockGraph>`:

```js
<BlockGraph
  // other props
  applyGesture={this.applyGesture}
  >
```

This function will be used by the `withGesures` wrapper to compute the blocks that are being displayed due to the gesture change.

The `applyGesture` prop is a function that takes a `Gesture` and a set of blocks and produces the changes that need to happen to those blocks when the gesture is "committed".

In pseudo-code this would look like:

```js
(Gesture, BlockData) => BlockDataModifications
```

The `Gesture` object is the very one that would come out of our `recognizer` function. So anything we define as returnable from `recoginzer` can come into this function. The `BlockData` object will be the list of blocks that we already provided to the `<BlockGraph>` `blocks` prop.

It is the job of this function to then provide an object with the shape of:

```js
{
  // list of blocks that the gesture updates with updated values
  // this includes new blocks as well as blocks that already exist
  modified: [],
  // list of blocks that the gesture will delete
  deleted: []
}
```

Here's a simple example of modifying the block based on a `move-block` gesture:

```js
const applyMoveBlock = (gesture, blocks) => {
	const timeDelta = (gesture.destination.timeIndex.seconds - gesture.origin.timeIndex.seconds);
	const block = gesture.block;
	const generated = {
    ...block,
    // flag this block as one generetad by a gesture
    gestured: true,
    // endTime changes when dragging or expanding the right side
    endTime: gesture.dragMode === 'left'
      ? block.endTime
      : block.endTime + timeDelta,
    // startTime changes when draggin or expanding left side
    startTime: gesture.dragMode === 'right'
      ? block.startTime
      : block.startTime + timeDelta,
    // the row changes if dragging tho whole block, not just one side
    row: gesture.dragMode === 'both'
      ? gesture.destination.timeIndex.row
      : block.row,
	};
  
  // merge and split iterates over exiting blocks and changes the generated
  // blocks that match the same row and time
  const result = mergeAndSplit(
    [generated],
    // don't include the block we're modifying
    blocks.filter(({ uid }) => uid !== block.uid)
  );
  // remove any blocks less than 45 minutes
	return { ... result, modified: result.modified.filter(b => {
		return !b.gestured || b.endTime - b.startTime >= 60 * 45;
	}) };
};
```

The `applyGesture` function can indicate that nothing is modified by returning empty lists:

```js
const applyGesture(gesture, blocks) => {
  switch (gesture.block) {
    case 'move':
      return applyMoveBlock(gesture, blocks);
  }
  return { modified: [], deleted: [] };
}
```

The `applyGesture` function at this point is only used to produce what can be considered _temporary_ blocks. They only exist within the `<BlockGraph>` to display how blocks will change according to the gesture the user is currently performing.

### Saving Blocks Generated by Gestures

To allow the parent component to signal that the changes from the gesture should be made more permanent, the `withGestures` wrapped component provides another prop named `onGesture

### Drawing Blocks, Recognizing Gestures, Producing Modifications, and Notifying

All tied together using a `<BlockGraph>` would loook like this:

```js

import withGestures from 'block-graph/with-gestures';
import recognizers from './recognizer';

const BlockGraph = withGestures(recognizer);

class Planner extends Component {
  // truncated for brevity
  
  /**
   * When the gesture changes, detect if it's a "commit" type gesture
   * and if it is, signal to a parent that the modifications produced by
   * that gesture should be chaged.
   * 
   * @param {Object} gesture - last gesture produced by the recognizer
   * @param {Object} prevGesture - the gesture before
   * @param {Function} getModifications - function that returns the modifications produced by a gesture with the current block graph data
   */
  onGestureChange = (gesture, prevGesture, getModifications) => {
    if (gesture.type === 'commit') {
      this.props.saveBlocks(getModifications(gesture));
    }
  }
  
  /**
   * @param {Object} gesture - the gesture that is modifying the blocks
   * @param {Array<Object>} blocks - the block data the gesture is modifying
   * @returns {Object} - modified and deleted blocks produced by the gesture
   */
  applyGesture = (gesture, blocks) => {
    // return any changes or by default no changes
    return { modified: [], deleted: [] };
  }

  render() {
    const { blocks, timeSpan, rows } = this.state;
    const { tickWidth, rowHeight } = this.props;
    // get the blocks that are the result of the gesture and the starting set of blocks
    return (
      <BlockGraph
        // not explained, but this would provide space in the blockgraph
        // for the fixed header and sidebar
        chromeOffset={{
          header: 36,
          sidebar: 200,
        }}
        
        // how to handle user interactions
        applyGesture={this.applyGesture}
        onGestureChange={this.handleGestureChange}
  
        // blocks and how to render them
        blocks={blocks}
        pixelsPerSecond={(tickWidth * 4) / SECONDS_PER_HOUR}
        graphTimeSpan={timeSpan}
        renderBlock={this.renderBlock}

        // rows and how to render them
        rows={rows}
        rowHeight={rowHeight}
        renderRow={this.renderRow}
      >
        {/* Child components will be rendered beneath the blocks */}
        <Gridlines /* gridline config data */ />
      </BlockGraph>
    );
  }
}

```
