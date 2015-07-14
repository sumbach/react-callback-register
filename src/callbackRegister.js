import invariant from 'invariant'


const callbackArray = Symbol()
const eventMap = Symbol()


function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}


function propFnFactory(name) {
  const fn = function (e, ...args) {
    if (this.props[name]) {
      this.props[name](e, ...args)
    }

    if (!e.defaultPrevented) {
      for (const fn of fn[callbackArray]) {
        fn.call(this, e, ...args)
      }
    }
  }

  fn[callbackArray] = []

  return fn
}


function addToEventMap(prototype, events, fn) {
  if (!prototype[eventMap]) {
    prototype[eventMap] = new Map
  }

  for (const event of events) {
    const name = 'on' + capitalize(event)

    if (!prototype[eventMap].has(name)) {
      prototype[eventMap].set(name, propFnFactory(name))
    }

    prototype[eventMap].get(name)[callbackArray].push(fn)
  }
}


export default function callbackRegister(component) {
  invariant(!component.prototype.callbacks, "@callbackRegister must be applied to a class with no `callbacks` property")
  invariant(!component.on, "@callbackRegister must be applied to a class with no static `on` property")

  component.on = function(events, fn) {
    if (!Array.isArray(events)) events = [events]

    addToEventMap(component.prototype, events, fn)
  }

  Object.defineProperty(component.prototype, 'callbacks', {
    configurable: true,
    enumerable: true,
    get: function() {
      const bound = {}
      for (let [name, unbound] of this[eventMap] || []) {
        bound[name] = unbound.bind(this)
      }

      // Redefine 'callbacks' with the bound version of our map so we don't
      // need to do it on the next render
      Object.defineProperty(this, 'callbacks', {
        value: bound,
        enumerable: true,
      })

      return bound
    },
  })
}


callbackRegister.on = function(...events) {
  return function(prototype, _, descriptor) {
    addToEventMap(prototype, events, descriptor.value)
  }
}
