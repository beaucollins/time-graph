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

Let's start with an ideal API that the `<Calendar>` would use:

```js
// In a parent's render
<BlockGraph
  size={{ width: 600, height: 400 }}
/>

// Definition
class BlockGraph extends Component {
  static propTypes = {

    size: PropTypes.shape({
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
    }).isRequired

  }
}
```

The parent component will tell the `<BlockGraph>` how much screen space it will have. So how can we tell it what to draw? It needs a list of what we call _blocks_. Each of these _blocks_ has a _startTime_ and _endTime_ in seconds since the unix epoch. It needs a new prop:

```js
static propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.shape({
    startTime: PropTypes.number.isRequired,
    endTime: PropTypes.number.isRequired,
  }))
}

// now used
<BlockGraph
  // other props and then
  blocks={this.state.blocksToPleaseRender}
/>
```
