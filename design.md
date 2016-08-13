## PROBLEMS

Currently:

- It's hard (impossible) get a reference to an instantiated falcor component by id
- You can't reference an object from another object (eg user -> profile)
- There isn't a way to load a component with a given id on demand, and there isn't a way to know if it's loaded yet (related to first)

Solution:

Two-pronged solution: stores and lists

### Core Concepts

#### Store

- "Global" like a DB -- reflects falcor as closely as possible. Declare a schema with atoms, refs, etc. Instantiates components, checks for updates, and ensures that only one per id is instantiated.

Methods:

- fetch(), async
- get(), sync
- put(), sync (only can put on empty ids)
  - starts watchers automatically
- has(), sync

#### List

- Just an ordered list of refs to items in a store
- It is at a location in the falcor graph.

- Methods:
  - .values() (array)
  - .append() (-> insert)
  - .prepend() (-> insert)
  - .insert()
  - .remove()
  - .move()
  - .range()
  - .fetchData()
  - .fetchRange()
  - .fetchRangeAndData()
  - .onError()
  - .onData()
