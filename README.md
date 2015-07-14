# react-callback-register

react-callback-register is a set of ES7 [class decorators](https://github.com/wycats/javascript-decorators) which make your life easier by merging callbacks (e.g. `onClick`) which are passed in via `props` with those defined on your class and by other decorators.

## Should I use react-callback-register?

### Do use it when:

- You want to accept callbacks on `props`, but you still want to be able to add your own callbacks without overwriting these

### Don't use it when:

- You don't want to accept any callbacks on `props`
- You **only** want to accept callbacks from `props` (use [react-passthrough](https://github.com/jamesknelson/react-passthrough) instead)

## How it works

Generally, when you want to accept a callback such as `onClick` from `props`, but also want to do something in `onClick` yourself, you'd call the `props` callback from your own one. It'd look something like this:

```
class MyComponent extends React.Component {
  static propTypes = {
    onClick: React.PropTypes.func,
  }

  onClick = e => {
    if (this.props.onClick) {
      this.props.onClick(e)
    }

    if (!e.defaultPrevented) {
      // Do you stuff
    }
  }

  render() {
    return <div onClick={this.onClick} />
  }
}
```

react-callback-register automates the above process for you by generating a *wrapper* callback for each event you register. This wrapper will look for a callback on `props` first, run it if it exists, and then run any other callbacks you've registered so long as `e.defaultPrevented` is not true.

All wrapper callbacks are added to the `this.callbacks` property on your component, which you then add to whatever DOM component you want to receive them. And, to save you from using the awkward property assignment syntax for bound methods, it'll bind your registered functions for you.

Using react-callback-register, The above code can be re-written as so:

```
@callbackRegister
class MyComponent extends React.Component {
  static propTypes = {
    onClick: React.PropTypes.func,
  }

  @callbackRegister.on('click')
  descriptiveName() {
    // Do you stuff
  }

  render() {
    return <div {...this.callbacks} />
  }
}
```

## How to use

*Make sure you can compile Stage 0 ES7 features - [see babel/webpack example](http://jamesknelson.com/unlocking-decorators-and-other-es7-features-with-webpack-and-babel)*

### Install it

```
npm install react-callback-register --save
```

### Import, decorate and add output to the DOM

```
import callbackRegister from "react-callback-register"

@callbackRegister
class MyComponent extends React.Component {
  render() {
    return <div {...this.callbacks}>Content</div>
  }
}
```

### Register your callbacks with `@callbackRegister.on(event1, event2, ...)`

Add this decorator to any method inside your class to register it as a callback for the given events. When run, it will be bound to your class, as you expect.

Example:

```
@callbackRegister.on('mouseUp', 'mouseOut', 'touchEnd')
deactivate(e) {
  this.props.deactivate(e)
}
```

### Register callbacks on extensions of your class with `MyComponent.on([event, ...], fn)`

Seeing `@callbackRegister.on` must be run on an ES2015 class method, it can only be used inside the class definition. When you'd like to add callbacks to a class after it has been created, for example while extending the class with another decorator, use the `on` static method which `@callbackRegister` adds to your class.

Example (taken from [react-base-control](https://github.com/jamesknelson/react-base-control)):

```
DecoratedComponent.on(['mouseDown', 'touchStart'], function(e) {
  if (e.button === 0 || e.button === undefined) {
    this.start(e)
  }
})
```

## Full example

This example uses react-callback-register to define a `Target` component which simplifies five callbacks (`mousedown`, `touchStart`, `mouseUp`, `mouseOut`, `touchEnd`) into `activate` and `deactivate`. It is useful for changing style while a user is interacting with a control.

```
import React, {Component, PropTypes} from 'react'
import callbackRegister from 'react-callback-register'


@callbackRegister
export default class Target extends Component {
  static propTypes = {
    activate: PropTypes.func.isRequired,
    deactivate: PropTypes.func.isRequired,
  }


  @callbackRegister.on('mouseDown')
  activateIfLeftClick(e) {
    if (e.button === 0) this.props.activate(e)
  }

  @callbackRegister.on('touchStart')
  activate() {
    this.props.activate(e)
  }

  @callbackRegister.on('mouseUp', 'mouseOut', 'touchEnd')
  deactivate(e) {
    this.props.deactivate(e)
  }


  render() {
    const {activate, deactivate, children, ...other} = this.props;

    return (
      <div {...other} {...this.callbacks}>
        {children}
      </div>
    )
  }
}
```
